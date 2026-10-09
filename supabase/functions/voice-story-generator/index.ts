import { createClient } from 'npm:@supabase/supabase-js@2'
import { callAI } from '../_shared/ai-utils.ts'
import { withCors } from '../_shared/cors.ts'
import { withErrorHandling, AppError } from '../_shared/error-handler.ts'
import { requireUser, requireActiveSubscription } from '../_shared/auth.ts'
import { initLogger } from '../_shared/logger.ts'
import {
  SUPPORTED_LANGUAGES,
  VOICE_CONFIGS,
  AUDIO_QUALITY_SETTINGS,
  STORY_STYLES,
  STORY_TONES,
  SOUND_EFFECTS,
  MAX_RETRIES,
  RETRY_DELAY,
  MAX_STORY_LENGTH,
  CACHE_DURATION,
  MAX_AUDIO_DURATION,
  MIN_AUDIO_DURATION,
  DEFAULT_SPEAKING_RATE,
  DEFAULT_PITCH,
  ERROR_MESSAGES,
  type SupportedLanguage,
} from './constants.ts'

const logger = initLogger('voice-story-generator')
const db = () => createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

// ---- Types ----------------------------------------------------------------
interface StoryData {
  person?: { name: string; birthDate?: string; birthPlace?: string; lifeEvents?: Array<{ date: string; description: string; type: string }> }
  family?: { name: string; members: Array<{ name: string; relationship: string; birthDate?: string }> }
  historical?: { period: string; events: Array<{ date: string; description: string; significance: string }> }
  custom?: { title: string; content: string }
}

interface StoryOptions {
  language?: SupportedLanguage
  voice?: { gender?: 'male' | 'female' | 'neutral' }
  style?: typeof STORY_STYLES[number]
  tone?: typeof STORY_TONES[number]
  audioFormat?: 'MP3' | 'WAV'
  audioQuality?: keyof typeof AUDIO_QUALITY_SETTINGS
  speakingRate?: number
  pitch?: number
}

interface VoiceStoryRequest { data: StoryData; options?: StoryOptions }

// ---- Helpers --------------------------------------------------------------
const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export function validateRequest(req: VoiceStoryRequest): void {
  const d = req?.data
  if (!d || !(d.person || d.family || d.historical || d.custom)) throw new AppError(ERROR_MESSAGES.VALIDATION.STORY_DATA_REQUIRED, 400)
  if (d.person && !d.person.name?.trim()) throw new AppError(ERROR_MESSAGES.VALIDATION.PERSON_NAME_REQUIRED, 400)
  if (d.family && !d.family.name?.trim()) throw new AppError(ERROR_MESSAGES.VALIDATION.FAMILY_NAME_REQUIRED, 400)
  const o = req.options
  if (o?.language && !SUPPORTED_LANGUAGES.includes(o.language)) throw new AppError(ERROR_MESSAGES.VALIDATION.UNSUPPORTED_LANGUAGE, 400)
  if (o?.audioFormat && !['MP3', 'WAV'].includes(o.audioFormat)) throw new AppError(ERROR_MESSAGES.VALIDATION.UNSUPPORTED_AUDIO_FORMAT, 400)
  if (o?.style && !STORY_STYLES.includes(o.style)) throw new AppError('Unsupported story style', 400)
  if (o?.tone && !STORY_TONES.includes(o.tone)) throw new AppError('Unsupported story tone', 400)
  if (o?.speakingRate !== undefined && (o.speakingRate < 0.25 || o.speakingRate > 4)) throw new AppError('speakingRate must be between 0.25 and 4', 400)
  if (o?.pitch !== undefined && (o.pitch < -20 || o.pitch > 20)) throw new AppError('pitch must be between -20 and 20', 400)
  if (JSON.stringify(d).length > 50_000) throw new AppError('Story data is too large', 400)
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      logger.warn(`Operation failed (attempt ${attempt}/${maxRetries})`, error)
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, RETRY_DELAY * attempt))
    }
  }
  throw lastError
}

const voiceCache = new Map<string, { name: string; timestamp: number }>()

export function selectVoice(language: SupportedLanguage, gender?: 'male' | 'female' | 'neutral'): string {
  const key = `${language}-${gender ?? 'any'}`
  const cached = voiceCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.name

  const voices = VOICE_CONFIGS[language]
  if (!voices?.length) throw new AppError(`No voices available for language: ${language}`, 400)
  const pool = gender ? voices.filter((v) => v.gender === gender) : voices
  const chosen = (pool.find((v) => v.recommended) ?? pool[0] ?? voices.find((v) => v.recommended) ?? voices[0]).name
  voiceCache.set(key, { name: chosen, timestamp: Date.now() })
  return chosen
}

export function generatePrompt(data: StoryData, options: StoryOptions = {}): string {
  let prompt = `Write a ${options.style ?? 'narrative'} story in a ${options.tone ?? 'formal'} tone about `
  if (data.person) {
    const p = data.person
    prompt += `${p.name}${p.birthDate ? `, born ${p.birthDate}` : ''}${p.birthPlace ? ` in ${p.birthPlace}` : ''}`
    if (p.lifeEvents?.length) prompt += `. Key life events: ${p.lifeEvents.map((e) => `${e.date}: ${e.description}`).join('; ')}`
  } else if (data.family) {
    const f = data.family
    prompt += `the ${f.name} family. Members: ${f.members.map((m) => `${m.name} (${m.relationship})`).join(', ')}`
  } else if (data.historical) {
    prompt += `the period ${data.historical.period}. Events: ${data.historical.events.map((e) => `${e.date}: ${e.description}`).join('; ')}`
  } else if (data.custom) {
    prompt += `${data.custom.title}: ${data.custom.content}`
  }
  return `${prompt}. The story should be engaging and suitable for voice narration. Use only the facts provided; do not invent dates, names or places. Keep it under ${MAX_STORY_LENGTH} words.`
}

async function generateStoryText(data: StoryData, options: StoryOptions): Promise<string> {
  try {
    const res = await withRetry(() =>
      callAI({
        messages: [
          {
            role: 'system',
            content:
              'You are a professional storyteller specializing in genealogical narratives. Write natural, flowing prose that works well when spoken aloud. Stay faithful to the facts you are given.',
          },
          { role: 'user', content: generatePrompt(data, options) },
        ],
        maxTokens: 2000,
        temperature: 0.7,
      })
    )
    const text = res.content.trim()
    if (text.split(/\s+/).length > MAX_STORY_LENGTH) throw new AppError(ERROR_MESSAGES.VALIDATION.STORY_TOO_LONG, 400)
    return text
  } catch (error) {
    if (error instanceof AppError) throw error
    logger.error('Failed to generate story text', error)
    throw new AppError(ERROR_MESSAGES.PROCESSING.STORY_GENERATION_FAILED, 502, 'AI_ERROR')
  }
}

export function detectSoundEffects(text: string): Array<{ file: string; volume: string; category: string }> {
  const found: Array<{ file: string; volume: string; category: string }> = []
  for (const group of Object.values(SOUND_EFFECTS)) {
    for (const fx of group) if (fx.pattern.test(text)) found.push({ file: fx.file, volume: fx.volume, category: fx.category })
  }
  return found
}

export function formatSSML(text: string, options: StoryOptions = {}): string {
  const rate = options.speakingRate ?? DEFAULT_SPEAKING_RATE
  const body = text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeXml(para.trim()).replace(/([.!?])\s+/g, '$1 <break time="300ms"/> ')}</p>`)
    .join('<break time="700ms"/>')
  return `<speak><prosody rate="${Math.round(rate * 100)}%">${body}</prosody></speak>`
}

export function calculateAudioDuration(text: string, speakingRate: number): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.ceil((words / 150) * 60 / speakingRate) // ~150 words/min at normal speed
}

// Google Cloud Text-to-Speech via REST (the gRPC client library does not run on Edge Functions).
async function synthesize(ssml: string, language: SupportedLanguage, voiceName: string, options: StoryOptions): Promise<Uint8Array> {
  const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY')
  if (!apiKey) throw new AppError('Voice service is not configured', 503, 'TTS_NOT_CONFIGURED')
  const quality = AUDIO_QUALITY_SETTINGS[options.audioQuality ?? 'medium']
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      input: { ssml },
      voice: { languageCode: voiceName.split('-').slice(0, 2).join('-') || language, name: voiceName },
      audioConfig: {
        audioEncoding: options.audioFormat === 'WAV' ? 'LINEAR16' : 'MP3',
        speakingRate: 1.0, // speed is applied in the SSML prosody tag
        pitch: options.pitch ?? DEFAULT_PITCH,
        volumeGainDb: quality.volumeGainDb,
        effectsProfileId: [...quality.effectsProfileId],
      },
    }),
  })
  if (!res.ok) {
    logger.error('Google TTS error', `${res.status} ${await res.text()}`)
    throw new AppError(ERROR_MESSAGES.PROCESSING.AUDIO_GENERATION_FAILED, 502, 'TTS_ERROR')
  }
  const { audioContent } = await res.json()
  if (!audioContent) throw new AppError(ERROR_MESSAGES.PROCESSING.AUDIO_GENERATION_FAILED, 502, 'TTS_ERROR')
  return Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0))
}

async function uploadAudio(userId: string, audio: Uint8Array, format: 'MP3' | 'WAV'): Promise<string> {
  const ext = format === 'MP3' ? 'mp3' : 'wav'
  // Files live under the owner's folder in a PRIVATE bucket; callers get a short-lived signed URL.
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const client = db()
  const { error } = await client.storage.from('voice-stories').upload(path, audio, {
    contentType: format === 'MP3' ? 'audio/mpeg' : 'audio/wav',
    cacheControl: '3600',
  })
  if (error) {
    logger.error('Upload failed', error)
    throw new AppError(ERROR_MESSAGES.PROCESSING.AUDIO_UPLOAD_FAILED, 500, 'STORAGE_ERROR')
  }
  const { data, error: signError } = await client.storage.from('voice-stories').createSignedUrl(path, 60 * 60 * 24)
  if (signError || !data) throw new AppError(ERROR_MESSAGES.PROCESSING.STORAGE_ERROR, 500, 'STORAGE_ERROR')
  return data.signedUrl
}

// ---- Handler ----------------------------------------------------------------
export async function handleRequest(req: Request): Promise<Response> {
  const startTime = Date.now()
  if (req.method !== 'POST') throw new AppError('Method not allowed', 405)

  const user = await requireUser(req)
  await requireActiveSubscription(user)

  const request = (await req.json()) as VoiceStoryRequest
  validateRequest(request)

  const options = request.options ?? {}
  const language = options.language ?? 'en-US'
  const format = options.audioFormat ?? 'MP3'
  const speakingRate = options.speakingRate ?? DEFAULT_SPEAKING_RATE
  const voiceName = selectVoice(language, options.voice?.gender)

  const storyText = await generateStoryText(request.data, options)
  const wordCount = storyText.split(/\s+/).filter(Boolean).length

  const duration = calculateAudioDuration(storyText, speakingRate)
  if (duration > MAX_AUDIO_DURATION) throw new AppError(ERROR_MESSAGES.VALIDATION.AUDIO_TOO_LONG, 400)
  if (duration < MIN_AUDIO_DURATION) throw new AppError(ERROR_MESSAGES.VALIDATION.AUDIO_TOO_SHORT, 422)

  const audio = await withRetry(() => synthesize(formatSSML(storyText, options), language, voiceName, options))
  const audioUrl = await withRetry(() => uploadAudio(user.id, audio, format))

  const result = {
    id: crypto.randomUUID(),
    storyText,
    audioUrl,
    duration,
    wordCount,
    metadata: {
      language,
      voice: voiceName,
      style: options.style ?? 'narrative',
      tone: options.tone ?? 'formal',
      audioFormat: format,
      audioQuality: options.audioQuality ?? 'medium',
      processingTime: Date.now() - startTime,
      soundEffects: detectSoundEffects(storyText),
    },
  }

  const { error: dbError } = await db().from('voice_stories').insert({
    id: result.id,
    user_id: user.id,
    story_text: storyText,
    audio_path: audioUrl,
    duration,
    word_count: wordCount,
    voice_name: voiceName,
    language,
    style: result.metadata.style,
    tone: result.metadata.tone,
    audio_format: format,
    audio_quality: result.metadata.audioQuality,
    metadata: result.metadata,
  })
  if (dbError) logger.error('Failed to store story result', dbError) // the user still gets their story

  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

if (import.meta.main) Deno.serve(withCors(withErrorHandling(handleRequest)))
