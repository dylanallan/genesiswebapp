import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { cfg } from '../_shared/runtime-config.ts'

// Permanently removes the caller's account: their files, every row they own, then the login itself.
// The client must send { confirm: "DELETE" } so a stray request can never erase anyone.
Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const body = await req.json().catch(() => ({}))
    if (body?.confirm !== 'DELETE') return json({ error: 'Please type DELETE to confirm' }, 400, cors)

    const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // A running PayPal plan would keep charging, so it must be cancelled first.
    const { data: sub, error: subError } = await db.from('subscriptions').select('provider,status,cancel_at_period_end').eq('user_id', user.id).maybeSingle()
    if (subError) throw subError // never risk deleting while a plan might still be billing
    if (sub && sub.provider === 'paypal' && sub.status === 'active' && !sub.cancel_at_period_end) {
      return json({ error: 'Please cancel your PayPal plan on the Plans & billing page first, so you are not charged again.' }, 409, cors)
    }

    // Files live under "<user id>/..." in each bucket. Check every bucket, so new ones are never missed.
    const { data: buckets, error: bucketsError } = await db.storage.listBuckets()
    if (bucketsError) throw bucketsError
    for (const bucket of (buckets ?? []).map((b) => b.id)) {
      const paths: string[] = []
      const walk = async (prefix: string, depth: number) => {
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000, offset })
          if (error) throw error
          for (const item of data ?? []) {
            const path = `${prefix}/${item.name}`
            if (item.id) paths.push(path)
            else if (depth < 3) await walk(path, depth + 1) // a folder
          }
          if (!data || data.length < 1000) return
        }
      }
      await walk(user.id, 0)
      for (let i = 0; i < paths.length; i += 100) {
        const { error } = await db.storage.from(bucket).remove(paths.slice(i, i + 100))
        if (error) throw error
      }
    }

    // Rows in every table with a user_id column. Some tables point at others, so retry a few rounds.
    const { data: tables, error: tablesError } = await db.rpc('user_data_tables')
    if (tablesError) throw tablesError
    let remaining: string[] = (tables ?? []) as string[]
    for (let round = 0; round < 4 && remaining.length; round++) {
      const failed: string[] = []
      for (const table of remaining) {
        const { error } = await db.from(table).delete().eq('user_id', user.id)
        if (error) failed.push(table)
      }
      remaining = failed
    }
    if (remaining.length) {
      // Stop before removing the login, so the person can try again and nothing is left orphaned.
      console.error('delete-account: could not clear', remaining.join(', '))
      return json({ error: 'Some of your data could not be removed yet. Please try again in a few minutes.' }, 500, cors)
    }
    const { error: profileError } = await db.from('profiles').delete().eq('id', user.id)
    if (profileError) throw profileError

    const { error: authError } = await db.auth.admin.deleteUser(user.id)
    if (authError) throw authError
    return json({ success: true }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
