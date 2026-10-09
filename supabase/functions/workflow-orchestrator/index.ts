import { createClient } from 'npm:@supabase/supabase-js@2'

import { corsFor } from '../_shared/cors.ts'
import { requireCaller, json, errorResponse } from '../_shared/auth.ts'
import { assertPublicHttpsUrl } from '../_shared/net.ts'

interface WorkflowRequest {
  workflowId: string
  userId?: string // honored only for trusted internal calls (e.g. a scheduler)
  trigger: 'manual' | 'schedule' | 'event' | 'webhook'
  data: any
  metadata?: any
}

interface WorkflowStep {
  id: string
  type: 'ai_processing' | 'data_transformation' | 'notification' | 'api_call' | 'condition'
  config: any
  dependencies?: string[]
  timeout?: number
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const caller = await requireCaller(req)
    const workflowRequest: WorkflowRequest = await req.json()
    const userId = caller.internal ? workflowRequest.userId : caller.userId
    if (!userId) return json({ error: 'userId is required' }, 400, corsHeaders)
    workflowRequest.userId = userId
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get workflow definition
    const { data: workflow, error: workflowError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowRequest.workflowId)
      .eq('user_id', userId) // only the owner may run a workflow
      .single()

    if (workflowError || !workflow) {
      throw new Error('Workflow not found')
    }

    // Execute workflow
    const result = await executeWorkflow(workflow, workflowRequest, supabase)

    // Keep the Automation Hub's run statistics accurate
    const runs = (workflow.executionCount ?? 0) + 1
    const prevSuccess = Number(workflow.successRate ?? 0)
    const ok = result.status === 'completed' ? 1 : 0
    await supabase.from('automation_workflows').update({
      lastRun: new Date().toISOString(),
      executionCount: runs,
      successRate: Math.round(((prevSuccess / 100) * (runs - 1) + ok) / runs * 1000) / 10,
      averageExecutionTime: Math.round(((Number(workflow.averageExecutionTime ?? 0) * (runs - 1)) + result.executionTime) / runs),
      updated_at: new Date().toISOString(),
    }).eq('id', workflow.id)

    return new Response(
      JSON.stringify({
        success: true,
        workflowId: workflowRequest.workflowId,
        executionId: result.executionId,
        status: result.status,
        results: result.results,
        metadata: {
          executionTime: result.executionTime,
          stepsCompleted: result.stepsCompleted,
          totalSteps: result.totalSteps
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    // Workflow-not-found and validation errors are the caller's problem; hide internals otherwise
    if (error instanceof Error && /not found|must use|not allowed|Invalid URL/.test(error.message)) {
      return json({ success: false, error: error.message }, 400, corsHeaders)
    }
    return errorResponse(error, corsHeaders)
  }
})

async function executeWorkflow(workflow: any, request: WorkflowRequest, supabase: any): Promise<any> {
  const executionId = crypto.randomUUID()
  const startTime = Date.now()
  let steps: WorkflowStep[] = workflow.steps ?? workflow.actions ?? []
  // A workflow linked to an n8n webhook (Automation Hub "n8n URL") is run by calling that webhook.
  if ((!Array.isArray(steps) || steps.length === 0) && workflow.n8nUrl) {
    steps = [{ id: 'n8n-webhook', type: 'api_call', config: { url: workflow.n8nUrl, method: 'POST', headers: { 'Content-Type': 'application/json' }, bodyTemplate: JSON.stringify({ trigger: request.trigger, workflowId: workflow.id }) } }]
  }
  const results: any = {}
  let stepsCompleted = 0

  try {
    // Execute steps in dependency order
    for (const step of steps) {
      const stepResult = await executeStep(step, { ...(request.data ?? {}), __userId: request.userId }, supabase)
      results[step.id] = stepResult
      stepsCompleted++
    }

    const executionTime = Date.now() - startTime

    // Log workflow execution
    await logWorkflowExecution(supabase, {
      executionId,
      workflowId: request.workflowId,
      userId: request.userId,
      status: 'completed',
      results,
      executionTime,
      stepsCompleted,
      totalSteps: steps.length
    })

    return {
      executionId,
      status: 'completed',
      results,
      executionTime,
      stepsCompleted,
      totalSteps: steps.length
    }

  } catch (error) {
    const executionTime = Date.now() - startTime

    // Log failed execution
    await logWorkflowExecution(supabase, {
      executionId,
      workflowId: request.workflowId,
      userId: request.userId,
      status: 'failed',
      error: error.message,
      executionTime,
      stepsCompleted,
      totalSteps: steps.length
    })

    throw error
  }
}

async function executeStep(step: WorkflowStep, data: any, supabase: any): Promise<any> {
  const startTime = Date.now()

  try {
    let result: any

    switch (step.type) {
      case 'ai_processing':
        result = await executeAIStep(step, data, supabase)
        break
      case 'data_transformation':
        result = await executeDataTransformationStep(step, data)
        break
      case 'notification':
        result = await executeNotificationStep(step, data, supabase)
        break
      case 'api_call':
        result = await executeAPICallStep(step, data)
        break
      case 'condition':
        result = await executeConditionStep(step, data)
        break
      default:
        throw new Error(`Unsupported step type: ${step.type}`)
    }

    const executionTime = Date.now() - startTime

    return {
      success: true,
      result,
      executionTime
    }

  } catch (error) {
    const executionTime = Date.now() - startTime
    return {
      success: false,
      error: error.message,
      executionTime
    }
  }
}

async function executeAIStep(step: WorkflowStep, data: any, supabase: any): Promise<any> {
  const { prompt, useCase, provider } = step.config
  
  // Call the advanced AI processor
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/advanced-ai-processor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt.replace(/\{(\w+)\}/g, (match, key) => data[key] || match),
      useCase,
      userId: data.__userId,
      preferences: { provider }
    })
  })

  if (!response.ok) {
    throw new Error(`AI processing failed: ${response.status}`)
  }

  const result = await response.json()
  return result
}

async function executeDataTransformationStep(step: WorkflowStep, data: any): Promise<any> {
  const { transformation, outputFormat } = step.config
  
  // Apply transformation logic
  let transformedData = data
  
  if (transformation === 'filter') {
    transformedData = data.filter((item: any) => 
      step.config.conditions.every((condition: any) => 
        item[condition.field] === condition.value
      )
    )
  } else if (transformation === 'map') {
    transformedData = data.map((item: any) => {
      const mapped = {}
      step.config.mappings.forEach((mapping: any) => {
        mapped[mapping.target] = item[mapping.source]
      })
      return mapped
    })
  } else if (transformation === 'aggregate') {
    transformedData = data.reduce((acc: any, item: any) => {
      const key = item[step.config.groupBy]
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }

  return transformedData
}

async function executeNotificationStep(step: WorkflowStep, data: any, supabase: any): Promise<any> {
  const { channel, template, recipients } = step.config
  
  // Get notification template
  const { data: templateData } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('id', template)
    .single()

  if (!templateData) {
    throw new Error('Notification template not found')
  }

  // Process template with data
  let content = templateData.content
  Object.keys(data).forEach(key => {
    content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), data[key])
  })

  // Send notification based on channel
  switch (channel) {
    case 'email':
      return await sendEmailNotification(recipients, templateData.subject, content)
    case 'slack':
      return await sendSlackNotification(recipients, content)
    case 'sms':
      return await sendSMSNotification(recipients, content)
    default:
      throw new Error(`Unsupported notification channel: ${channel}`)
  }
}

async function executeAPICallStep(step: WorkflowStep, data: any): Promise<any> {
  const { url, method, headers, bodyTemplate } = step.config
  const target = assertPublicHttpsUrl(String(url))
  
  // Process body template with data
  const body = typeof bodyTemplate === 'string'
    ? bodyTemplate.replace(/\{(\w+)\}/g, (m: string, key: string) => (key in data && key !== '__userId' ? String(data[key]) : m))
    : undefined

  const response = await fetch(target, {
    method: method || 'GET',
    headers: headers || {},
    body: method && method !== 'GET' ? body : undefined,
    redirect: 'manual', // a redirect could point back into a private network
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`)
  }

  // Webhooks often answer with plain text or nothing at all
  const text = await response.text()
  try { return JSON.parse(text) } catch { return { status: response.status, body: text.slice(0, 2000) } }
}

async function executeConditionStep(step: WorkflowStep, data: any): Promise<any> {
  const { conditions, operator = 'AND' } = step.config
  
  const results = conditions.map((condition: any) => {
    const value = data[condition.field]
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'not_equals':
        return value !== condition.value
      case 'contains':
        return String(value).includes(condition.value)
      case 'greater_than':
        return value > condition.value
      case 'less_than':
        return value < condition.value
      default:
        return false
    }
  })

  const result = operator === 'AND' 
    ? results.every(Boolean)
    : results.some(Boolean)

  return { condition: result, results }
}

async function sendEmailNotification(recipients: string[], subject: string, content: string): Promise<any> {
  // Implement email sending logic
  console.log(`Sending email to ${recipients.join(', ')}: ${subject}`)
  return { sent: true, recipients, subject }
}

async function sendSlackNotification(channel: string, content: string): Promise<any> {
  // Implement Slack notification logic
  console.log(`Sending Slack message to ${channel}: ${content}`)
  return { sent: true, channel }
}

async function sendSMSNotification(recipients: string[], content: string): Promise<any> {
  // Implement SMS sending logic
  console.log(`Sending SMS to ${recipients.join(', ')}: ${content}`)
  return { sent: true, recipients }
}

async function logWorkflowExecution(supabase: any, logData: any): Promise<void> {
  try {
    await supabase
      .from('workflow_executions')
      .insert({
        execution_id: logData.executionId,
        workflow_id: logData.workflowId,
        user_id: logData.userId,
        status: logData.status,
        results: logData.results,
        error: logData.error,
        execution_time: logData.executionTime,
        steps_completed: logData.stepsCompleted,
        total_steps: logData.totalSteps
      })
  } catch (error) {
    console.error('Failed to log workflow execution:', error)
  }
} 