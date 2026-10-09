import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, requireActiveSubscription, json, errorResponse } from '../_shared/auth.ts'

// Family voice preservation (Pro), using ElevenLabs Instant Voice Cloning.
//   create { name, relationship?, samplePath, consent: true } -> voice profile
//   speak  { profileId, text }                                -> { audioUrl } (signed, 24h)
//   delete { profileId }                                      -> removes the voice at ElevenLabs, the sample and the profile
//   sample { profileId }                                      -> { audioUrl } of the original recording
// Env: ELEVENLABS_API_KEY. Voices are only created with the speaker's documented consent.
const API = 'https://api.elevenlabs.io/v1'
const MAX_PROFILES = 5
const MAX_TEXT = 2500
const CONSENT = 'I am this person, or I have their permission, to record and recreate their voice for my family\'s private use.'

const db = () => createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const key = Deno.env.get('ELEVENLABS_API_KEY')
    const body = await req.json()
    const action = String(body.action ?? '')
    const client = db()

    const loadProfile = async () => {
      const { data } = await client.from('voice_profiles').select('*').eq('id', String(body.profileId ?? '')).eq('user_id', user.id).maybeSingle()
      return data
    }

    if (action === 'sample') {
      const p = await loadProfile()
      if (!p) return json({ error: 'Voice not found' }, 404, cors)
      const { data } = await client.storage.from('voice-samples').createSignedUrl(p.sample_path, 3600)
      return json({ audioUrl: data?.signedUrl ?? null }, 200, cors)
    }

    if (action === 'delete') {
      const p = await loadProfile()
      if (!p) return json({ error: 'Voice not found' }, 404, cors)
      if (p.provider_voice_id && key) {
        const r = await fetch(`${API}/voices/${encodeURIComponent(p.provider_voice_id)}`, { method: 'DELETE', headers: { 'xi-api-key': key } })
        if (!r.ok && r.status !== 404) console.error('ElevenLabs delete failed', r.status, await r.text())
      }
      await client.storage.from('voice-samples').remove([p.sample_path])
      await client.from('voice_profiles').delete().eq('id', p.id)
      return json({ ok: true }, 200, cors)
    }

    // Creating and using cloned voices is a Pro feature and needs the provider configured.
    await requireActiveSubscription(user)
    if (!key) return json({ error: 'Voice preservation is not configured' }, 503, cors)

    if (action === 'create') {
      const name = String(body.name ?? '').trim().slice(0, 80)
      const relationship = String(body.relationship ?? '').trim().slice(0, 80)
      const samplePath = String(body.samplePath ?? '')
      if (!name) return json({ error: 'Please give this voice a name' }, 400, cors)
      if (body.consent !== true) return json({ error: 'Consent is required to preserve a voice' }, 400, cors)
      if (!samplePath.startsWith(`${user.id}/`) || samplePath.includes('..')) return json({ error: 'Invalid recording' }, 403, cors)

      const { count } = await client.from('voice_profiles').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      if ((count ?? 0) >= MAX_PROFILES) return json({ error: `You can keep up to ${MAX_PROFILES} voices. Delete one to add another.` }, 400, cors)

      const { data: file, error: dlError } = await client.storage.from('voice-samples').download(samplePath)
      if (dlError || !file) return json({ error: 'Recording not found' }, 404, cors)
      if (file.size < 20_000) return json({ error: 'The recording is too short. Please record at least 30 seconds of clear speech.' }, 400, cors)

      const form = new FormData()
      form.append('name', `${name} (${user.id.slice(0, 8)})`)
      form.append('description', relationship ? `Family voice: ${relationship}` : 'Family voice')
      form.append('files', file, samplePath.split('/').pop() ?? 'sample.webm')
      const r = await fetch(`${API}/voices/add`, { method: 'POST', headers: { 'xi-api-key': key }, body: form, signal: AbortSignal.timeout(60000) })
      const out = await r.json().catch(() => ({}))
      if (!r.ok || !out.voice_id) {
        console.error('ElevenLabs add voice failed', r.status, JSON.stringify(out).slice(0, 500))
        return json({ error: 'The voice could not be created. Please try a clearer recording.' }, 502, cors)
      }

      const { data: profile, error } = await client.from('voice_profiles').insert({
        user_id: user.id, name, relationship: relationship || null, sample_path: samplePath,
        provider: 'elevenlabs', provider_voice_id: out.voice_id, consent_statement: CONSENT,
      }).select('id,name,relationship,created_at').single()
      if (error) throw error
      return json({ profile }, 200, cors)
    }

    if (action === 'speak') {
      const text = String(body.text ?? '').trim()
      if (!text) return json({ error: 'Enter some text for the voice to read' }, 400, cors)
      if (text.length > MAX_TEXT) return json({ error: `Text too long (max ${MAX_TEXT} characters)` }, 400, cors)
      const p = await loadProfile()
      if (!p?.provider_voice_id) return json({ error: 'Voice not found' }, 404, cors)

      const r = await fetch(`${API}/text-to-speech/${encodeURIComponent(p.provider_voice_id)}`, {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.85 } }),
        signal: AbortSignal.timeout(60000),
      })
      if (!r.ok) {
        console.error('ElevenLabs TTS failed', r.status, await r.text())
        return json({ error: 'The story could not be generated. Please try again.' }, 502, cors)
      }
      const audio = new Uint8Array(await r.arrayBuffer())
      const path = `${user.id}/${crypto.randomUUID()}.mp3`
      const { error: upError } = await client.storage.from('voice-stories').upload(path, audio, { contentType: 'audio/mpeg' })
      if (upError) throw upError
      const { data: signed } = await client.storage.from('voice-stories').createSignedUrl(path, 60 * 60 * 24)
      await client.from('voice_stories').insert({
        user_id: user.id, story_text: text, audio_path: path, word_count: text.split(/\s+/).length,
        voice_name: p.name, audio_format: 'MP3', metadata: { voiceProfileId: p.id },
      })
      return json({ audioUrl: signed?.signedUrl ?? null }, 200, cors)
    }

    return json({ error: 'Unknown action' }, 400, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
