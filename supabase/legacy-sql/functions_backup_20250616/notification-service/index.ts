import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { initLogger } from '../shared/logger.ts'
import { SmtpClient } from 'std/smtp/mod.ts'
import { Slack } from 'std/slack/mod.ts'

// Initialize logger
const logger = initLogger('notification-service', Deno.env.toObject())

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Initialize SMTP client for email notifications
const smtpClient = new SmtpClient({
  hostname: Deno.env.get('SMTP_HOSTNAME')!,
  port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
  username: Deno.env.get('SMTP_USERNAME')!,
  password: Deno.env.get('SMTP_PASSWORD')!,
  tls: true
})

// Initialize Slack client
const slack = new Slack({
  token: Deno.env.get('SLACK_BOT_TOKEN')!
})

// Serve the notification service
serve(async (req: Request) => {
  const startTime = Date.now()
  
  try {
    // Log incoming request
    await logger.logRequest(req)
    
    // Parse request
    const url = new URL(req.url)
    const path = url.pathname
    
    // API endpoints
    if (path.startsWith('/api/')) {
      const apiPath = path.replace('/api/', '')
      
      if (apiPath === 'notify') {
        return await handleNotification(req)
      } else if (apiPath === 'channels') {
        return await handleChannels(req)
      } else if (apiPath === 'templates') {
        return await handleTemplates(req)
      } else if (apiPath === 'health') {
        return await handleHealthCheck()
      }
    }
    
    // Not found
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    await logger.error('Error in notification service', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Handle notification request
async function handleNotification(req: Request): Promise<Response> {
  try {
    const { channel, template, data, recipients } = await req.json()
    
    // Validate request
    if (!channel || !template || !data) {
      throw new Error('Missing required fields')
    }
    
    // Get notification template
    const { data: templateData, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('name', template)
      .single()
    
    if (templateError || !templateData) {
      throw new Error('Template not found')
    }
    
    // Send notification through appropriate channel
    let result
    switch (channel) {
      case 'email':
        result = await sendEmail(templateData, data, recipients)
        break
      case 'slack':
        result = await sendSlackMessage(templateData, data)
        break
      case 'webhook':
        result = await sendWebhook(templateData, data, recipients)
        break
      default:
        throw new Error('Unsupported channel')
    }
    
    // Log notification
    await logNotification(channel, template, data, result)
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error sending notification', error)
    throw error
  }
}

// Handle channels request
async function handleChannels(req: Request): Promise<Response> {
  try {
    const { data: channels, error } = await supabase
      .from('notification_channels')
      .select('*')
    
    if (error) throw error
    
    return new Response(
      JSON.stringify(channels),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting channels', error)
    throw error
  }
}

// Handle templates request
async function handleTemplates(req: Request): Promise<Response> {
  try {
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('*')
    
    if (error) throw error
    
    return new Response(
      JSON.stringify(templates),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting templates', error)
    throw error
  }
}

// Handle health check
async function handleHealthCheck(): Promise<Response> {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: await checkDatabase(),
        email: await checkEmail(),
        slack: await checkSlack()
      }
    }
    
    return new Response(
      JSON.stringify(health),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error in health check', error)
    throw error
  }
}

// Send email notification
async function sendEmail(template: any, data: any, recipients: string[]) {
  const { subject, body } = renderTemplate(template, data)
  
  try {
    await smtpClient.send({
      from: Deno.env.get('SMTP_FROM')!,
      to: recipients.join(', '),
      subject,
      content: body,
      html: true
    })
    
    return { success: true }
  } catch (error) {
    await logger.error('Error sending email', error)
    throw error
  }
}

// Send Slack message
async function sendSlackMessage(template: any, data: any) {
  const { blocks } = renderTemplate(template, data)
  
  try {
    const result = await slack.chat.postMessage({
      channel: Deno.env.get('SLACK_CHANNEL')!,
      blocks
    })
    
    return { success: true, ts: result.ts }
  } catch (error) {
    await logger.error('Error sending Slack message', error)
    throw error
  }
}

// Send webhook notification
async function sendWebhook(template: any, data: any, webhooks: string[]) {
  const { body } = renderTemplate(template, data)
  const results = []
  
  for (const webhook of webhooks) {
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      results.push({
        webhook,
        success: response.ok,
        status: response.status
      })
    } catch (error) {
      await logger.error('Error sending webhook', { webhook, error })
      results.push({
        webhook,
        success: false,
        error: error.message
      })
    }
  }
  
  return { results }
}

// Render notification template
function renderTemplate(template: any, data: any) {
  let { subject, body, blocks } = template
  
  // Replace placeholders in template
  const replacePlaceholders = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] || ''
    })
  }
  
  if (subject) subject = replacePlaceholders(subject)
  if (body) body = replacePlaceholders(body)
  if (blocks) {
    blocks = blocks.map((block: any) => {
      if (block.text) {
        block.text.text = replacePlaceholders(block.text.text)
      }
      return block
    })
  }
  
  return { subject, body, blocks }
}

// Log notification
async function logNotification(channel: string, template: string, data: any, result: any) {
  const { error } = await supabase
    .from('notification_logs')
    .insert({
      channel,
      template,
      data,
      result,
      timestamp: new Date().toISOString()
    })
  
  if (error) {
    await logger.error('Error logging notification', error)
  }
}

// Check database health
async function checkDatabase() {
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('count')
      .limit(1)
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      error: error?.message
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

// Check email health
async function checkEmail() {
  try {
    await smtpClient.connect()
    await smtpClient.quit()
    
    return {
      status: 'healthy'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

// Check Slack health
async function checkSlack() {
  try {
    await slack.auth.test()
    
    return {
      status: 'healthy'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
} 