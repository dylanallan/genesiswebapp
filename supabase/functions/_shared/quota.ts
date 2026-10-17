// Daily allowance for paid-for AI services (photo analysis, voices, content processing), so no account can run up
// unlimited costs. Uses the same consume_daily_quota / refund_daily_quota counters as photo restoration.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { cfg } from './runtime-config.ts'

export interface DailyUse {
  ok: boolean
  limit: number
  pro: boolean
  message?: string
  refund: () => Promise<void>
}

export async function takeDailyUse(userId: string, kind: string, freeLimit: number, proLimit: number, what: string): Promise<DailyUse> {
  const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const { data: pro } = await db.rpc('has_pro_access', { p_user: userId })
  const limit = pro ? proLimit : freeLimit
  const refund = async () => { await db.rpc('refund_daily_quota', { p_user: userId, p_kind: kind }) }
  const { data: allowed, error } = await db.rpc('consume_daily_quota', { p_user: userId, p_kind: kind, p_limit: limit })
  if (error) throw error
  if (allowed) return { ok: true, limit, pro: !!pro, refund }
  return {
    ok: false, limit, pro: !!pro, refund,
    message: pro || freeLimit === proLimit
      ? `You've reached today's limit of ${limit} ${what}. You can do more tomorrow.`
      : `Free accounts can do ${limit} ${what} a day. Upgrade to Pro to do more.`,
  }
}
