import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'
import { TextToSpeechClient } from 'npm:@google-cloud/text-to-speech'
import { AIService } from '../shared/ai-utils.ts'
import { withCors } from '../shared/cors.ts'
import { withErrorHandling, AppError } from '../shared/error-handler.ts'
import { initLogger } from '../shared/logger.ts'
import {
  SUPPORTED_LANGUAGES,
  VOICE_CONFIGS,
  AUDIO_QUALITY_SETTINGS,
  STORY_STYLES,
  STORY_TONES,
  SOUND_EFFECTS,
  BACKGROUND_MUSIC,
  MAX_RETRIES,
  RETRY_DELAY,
  MAX_STORY_LENGTH,
  CACHE_DURATION,
  MAX_AUDIO_DURATION,
  MIN_AUDIO_DURATION,
  DEFAULT_SPEAKING_RATE,
  DEFAULT_PITCH,
  DEFAULT_VOLUME,
  ERROR_MESSAGES,
  type SupportedLanguage
} from './constants.ts'

// Initialize services
const logger = initLogger('voice-story-generator')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
const ttsClient = new TextToSpeechClient()
const aiService = new AIService()

// Voice cache
const voiceCache = new Map<string, {
  config: typeof VOICE_CONFIGS[keyof typeof VOICE_CONFIGS][number]
  timestamp: number
}>()

// Types
interface StoryData {
  person?: {
    name: string
    birthDate?: string
    birthPlace?: string
    lifeEvents?: Array<{
      date: string
      description: string
      type: string
    }>
  }
  family?: {
    name: string
    members: Array<{
      name: string
      relationship: string
      birthDate?: string
    }>
  }
  historical?: {
    period: string
    events: Array<{
      date: string
      description: string
      significance: string
    }>
  }
  custom?: {
    title: string
    content: string
    metadata?: Record<string, unknown>
  }
}

interface VoiceStoryRequest {
  data: StoryData
  options?: {
    language?: SupportedLanguage
    voice?: {
      name?: string
      gender?: 'male' | 'female' | 'neutral'
    }
    style?: typeof STORY_STYLES[number]
    tone?: typeof STORY_TONES[number]
    audioFormat?: 'MP3' | 'WAV'
    audioQuality?: keyof typeof AUDIO_QUALITY_SETTINGS
    speakingRate?: number
    pitch?: number
    volume?: number
    includeSoundEffects?: boolean
    includeBackgroundMusic?: boolean
    metadata?: Record<string, unknown>
  }
}

interface VoiceStoryResponse {
  id: string
  storyText: string
  audioUrl: string
  duration: number
  wordCount: number
  metadata: {
    language: SupportedLanguage
    voice: string
    style: string
    tone: string
    audioFormat: string
    audioQuality: string
    processingTime: number
    cacheHit: boolean
    soundEffects: Array<{
      type: string
      count: number
    }>
    backgroundMusic?: {
      file: string
      mood: string
    }
  }
}

// Validation
function validateRequest(request: VoiceStoryRequest): void {
  if (!request.data) {
    throw new AppError(ERROR_MESSAGES.VALIDATION.STORY_DATA_REQUIRED, 400)
  }

  if (request.data.person && !request.data.person.name) {
    throw new AppError(ERROR_MESSAGES.VALIDATION.PERSON_NAME_REQUIRED, 400)
  }

  if (request.data.family && !request.data.family.name) {
    throw new AppError(ERROR_MESSAGES.VALIDATION.FAMILY_NAME_REQUIRED, 400)
  }

  const language = request.options?.language ?? 'en-US'
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new AppError(ERROR_MESSAGES.VALIDATION.UNSUPPORTED_LANGUAGE, 400)
  }

  const audioFormat = request.options?.audioFormat ?? 'MP3'
  if (!['MP3', 'WAV'].includes(audioFormat)) {
    throw new AppError(ERROR_MESSAGES.VALIDATION.UNSUPPORTED_AUDIO_FORMAT, 400)
  }
}

// Retry utility
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      logger.warn(`Operation failed (attempt ${attempt}/${maxRetries})`, { error })
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  throw lastError
}

// Voice selection
function selectVoice(language: SupportedLanguage, gender?: 'male' | 'female' | 'neutral'): string {
  const cacheKey = `${language}-${gender ?? 'any'}`
  const cached = voiceCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.info('Voice cache hit', { language, gender, voice: cached.config.name })
    return cached.config.name
  }
  
  const voices = VOICE_CONFIGS[language]
  if (!voices?.length) {
    throw new AppError(`No voices available for language: ${language}`, 400)
  }
  
  let selectedVoice = voices.find(v => v.recommended)
  if (gender) {
    const genderVoice = voices.find(v => v.gender === gender)
    if (genderVoice) {
      selectedVoice = genderVoice
    }
  }
  
  if (!selectedVoice) {
    selectedVoice = voices[0]
  }
  
  voiceCache.set(cacheKey, {
    config: selectedVoice,
    timestamp: Date.now()
  })
  
  logger.info('Voice selected', { language, gender, voice: selectedVoice.name })
  return selectedVoice.name
}

// Story generation
async function generateStoryText(request: VoiceStoryRequest): Promise<string> {
  const { data, options } = request
  const style = options?.style ?? 'narrative'
  const tone = options?.tone ?? 'formal'
  
  let prompt = `Generate a ${style} story in a ${tone} tone about `
  
  if (data.person) {
    prompt += `${data.person.name}`
    if (data.person.birthDate) {
      prompt += `, born on ${data.person.birthDate}`
    }
    if (data.person.birthPlace) {
      prompt += ` in ${data.person.birthPlace}`
    }
    if (data.person.lifeEvents?.length) {
      prompt += '. Include these significant life events: ' + 
        data.person.lifeEvents.map(e => `${e.date}: ${e.description}`).join('; ')
    }
  } else if (data.family) {
    prompt += `the ${data.family.name} family, including ` +
      data.family.members.map(m => `${m.name} (${m.relationship})`).join(', ')
  } else if (data.historical) {
    prompt += `historical events during ${data.historical.period}, including ` +
      data.historical.events.map(e => `${e.date}: ${e.description}`).join('; ')
  } else if (data.custom) {
    prompt += data.custom.content
  }
  
  prompt += `. The story should be engaging and suitable for voice narration. ` +
    `Keep it under ${MAX_STORY_LENGTH} words. ` +
    `Format the text with appropriate pauses and emphasis for natural narration.`
  
  const response = await withRetry(() => aiService.generateText(prompt))
  const storyText = response.trim()
  
  if (storyText.split(/\s+/).length > MAX_STORY_LENGTH) {
    throw new AppError(ERROR_MESSAGES.VALIDATION.STORY_TOO_LONG, 400)
  }
  
  return storyText
}

// SSML formatting
function formatSSML(text: string, options: VoiceStoryRequest['options']): string {
  const {
    speakingRate = DEFAULT_SPEAKING_RATE,
    pitch = DEFAULT_PITCH,
    volume = DEFAULT_VOLUME,
    includeSoundEffects = false
  } = options ?? {}
  
  // Basic SSML structure
  let ssml = `<speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis">`
  
  // Add voice configuration
  ssml += `<voice name="${selectVoice(options?.language ?? 'en-US', options?.voice?.gender)}">`
  
  // Process text with pauses and emphasis
  const paragraphs = text.split('\n\n')
  for (const paragraph of paragraphs) {
    ssml += `<p>`
    
    const sentences = paragraph.split(/[.!?]+/).filter(Boolean)
    for (const sentence of sentences) {
      // Add emphasis to important words
      let processedSentence = sentence.replace(
        /\b(significant|important|remarkable|notable|crucial)\b/gi,
        '<emphasis level="strong">$1</emphasis>'
      )
      
      // Add pauses for natural flow
      processedSentence = processedSentence.replace(
        /[,;:]/g,
        '<break time="500ms"/>'
      )
      
      // Add sound effects if enabled
      if (includeSoundEffects) {
        for (const category of Object.values(SOUND_EFFECTS)) {
          for (const effect of category) {
            if (effect.pattern.test(processedSentence)) {
              processedSentence = processedSentence.replace(
                effect.pattern,
                `<audio src="${effect.file}" volume="${effect.volume}">$&</audio>`
              )
            }
          }
        }
      }
      
      ssml += processedSentence + '.'
      ssml += '<break time="700ms"/>'
    }
    
    ssml += `</p><break time="1000ms"/>`
  }
  
  ssml += `</voice></speak>`
  
  // Add prosody for overall voice characteristics
  ssml = ssml.replace(
    /<voice/g,
    `<voice rate="${speakingRate}" pitch="${pitch}dB" volume="${volume}dB"`
  )
  
  return ssml
}

// Audio generation
async function generateAudio(ssml: string, options: VoiceStoryRequest['options']): Promise<{
  audioContent: Uint8Array
  duration: number
}> {
  const audioFormat = options?.audioFormat ?? 'MP3'
  const audioQuality = options?.audioQuality ?? 'medium'
  const qualitySettings = AUDIO_QUALITY_SETTINGS[audioQuality]
  
  const [response] = await ttsClient.synthesizeSpeech({
    input: { ssml },
    voice: {
      languageCode: options?.language ?? 'en-US',
      name: selectVoice(options?.language ?? 'en-US', options?.voice?.gender)
    },
    audioConfig: {
      audioEncoding: audioFormat === 'MP3' ? 'MP3' : 'LINEAR16',
      speakingRate: options?.speakingRate ?? DEFAULT_SPEAKING_RATE,
      pitch: options?.pitch ?? DEFAULT_PITCH,
      volumeGainDb: qualitySettings.volumeGainDb,
      effectsProfileId: qualitySettings.effectsProfileId
    }
  })
  
  if (!response.audioContent) {
    throw new AppError(ERROR_MESSAGES.PROCESSING.AUDIO_GENERATION_FAILED, 500)
  }
  
  const duration = calculateAudioDuration(ssml, options?.speakingRate ?? DEFAULT_SPEAKING_RATE)
  
  if (duration > MAX_AUDIO_DURATION) {
    throw new AppError(ERROR_MESSAGES.VALIDATION.AUDIO_TOO_LONG, 400)
  }
  
  return {
    audioContent: response.audioContent,
    duration
  }
}

// Main handler
async function handleRequest(req: Request): Promise<Response> {
  const startTime = Date.now()
  
  // Parse and validate request
  const requestData = await req.json() as VoiceStoryRequest
  validateRequest(requestData)
  
  // Set default options
  const options = {
    style: requestData.options?.style || 'narrative',
    tone: requestData.options?.tone || 'formal',
    voice: selectVoice(requestData.options),
    audio: {
      includeMusic: requestData.options?.audio?.includeMusic || false,
      includeEffects: requestData.options?.audio?.includeEffects || false,
      format: requestData.options?.audio?.format || 'mp3',
      quality: requestData.options?.audio?.quality || 'high'
    },
    length: requestData.options?.length || 'medium',
    language: requestData.options?.language || 'en'
  }

  logger.info('Starting story generation', {
    style: options.style,
    tone: options.tone,
    language: options.language,
    voice: options.voice.name
  })

  // Generate story text with retry
  const storyText = await withRetry(() => generateStoryText(requestData.storyData, options))
  const wordCount = storyText.split(/\s+/).length
  
  if (wordCount > MAX_STORY_LENGTH) {
    logger.warn('Story exceeds maximum length', { wordCount, maxLength: MAX_STORY_LENGTH })
    throw new AppError('Generated story exceeds maximum length', 400, 'VALIDATION_ERROR')
  }

  logger.info('Story text generated', { wordCount })

  // Generate audio with retry
  const audioData = await withRetry(() => generateAudio(storyText, options))
  const audioDuration = calculateAudioDuration(storyText, options.voice.speakingRate)

  logger.info('Audio generated', {
    format: options.audio.format,
    duration: audioDuration,
    size: audioData.length
  })

  // Upload audio to storage with retry
  const audioUrl = await withRetry(() => uploadAudio(audioData, options.audio.format))

  // Prepare response
  const response: VoiceStoryResponse = {
    story: {
      text: storyText,
      wordCount,
      duration: audioDuration,
      style: options.style,
      tone: options.tone
    },
    audio: {
      url: audioUrl,
      format: options.audio.format,
      size: audioData.length,
      duration: audioDuration,
      voice: {
        name: options.voice.name,
        language: options.voice.language,
        gender: options.voice.gender
      }
    },
    metadata: {
      processingTime: Date.now() - startTime,
      aiUsage: true,
      timestamp: new Date().toISOString(),
      retries: 0, // Will be updated by withRetry
      cacheHit: !!voiceCache.get(`${options.voice.language}-${options.voice.gender}`)
    }
  }

  // Store result in database
  const { error: dbError } = await supabase
    .from('voice_stories')
    .insert({
      request_id: crypto.randomUUID(),
      input_data: requestData,
      output_data: response,
      processing_time: response.metadata.processingTime,
      created_at: response.metadata.timestamp,
      word_count: wordCount,
      audio_duration: audioDuration,
      voice_name: options.voice.name,
      language: options.voice.language
    })

  if (dbError) {
    logger.error('Failed to store story result', dbError)
    // Don't throw error, just log it
  }

  // Return response
  return new Response(
    JSON.stringify(response),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Helper functions
async function generateStoryText(
  data: StoryData,
  options: VoiceStoryRequest['options']
): Promise<string> {
  const prompt = generatePrompt(data, options)
  
  try {
    const response = await aiService.processRequest({
      prompt,
      model: 'claude-3-opus-20240229',
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompt: `You are a professional storyteller specializing in genealogical narratives.
Your task is to create engaging, historically accurate stories that bring family histories to life.
Focus on creating natural, flowing prose that works well when spoken aloud.
Use appropriate pauses and emphasis to enhance the listening experience.
Maintain historical accuracy while making the story engaging and personal.`
    })

    return response.content
  } catch (error) {
    logger.error('Failed to generate story text', error)
    throw new AppError('Failed to generate story text', 500, 'AI_ERROR')
  }
}

function generatePrompt(data: StoryData, options: VoiceStoryRequest['options']): string {
  const { style, tone, length, language } = options
  
  let prompt = `Create a ${length} ${style} story in ${language} with a ${tone} tone about `

  if (data.person) {
    prompt += `the life of ${data.person.name}`
    if (data.person.birthDate) {
      prompt += `, born ${data.person.birthDate}`
    }
    if (data.person.birthPlace) {
      prompt += ` in ${data.person.birthPlace}`
    }
  } else if (data.family) {
    prompt += `the ${data.family.name} family`
  }

  prompt += '.\n\n'

  // Add person details
  if (data.person) {
    prompt += 'Person Details:\n'
    prompt += JSON.stringify(data.person, null, 2) + '\n\n'
  }

  // Add family details
  if (data.family) {
    prompt += 'Family Details:\n'
    prompt += JSON.stringify(data.family, null, 2) + '\n\n'
  }

  // Add historical context
  if (data.historicalContext) {
    prompt += 'Historical Context:\n'
    prompt += JSON.stringify(data.historicalContext, null, 2) + '\n\n'
  }

  // Add style and tone instructions
  prompt += `Style Guidelines:
- Use a ${style} style that flows naturally when spoken
- Maintain a ${tone} tone throughout
- Include vivid descriptions and emotional elements
- Weave in historical context where relevant
- Focus on key life events and relationships
- Use natural transitions between events
- Keep sentences clear and concise for audio narration
- Include appropriate pauses and emphasis points

Please format the story with SSML tags for proper narration, including:
- <break> tags for natural pauses
- <emphasis> tags for important points
- <prosody> tags for emotional emphasis
- <say-as> tags for dates and numbers`

  return prompt
}

async function generateAudio(
  text: string,
  options: VoiceStoryRequest['options']
): Promise<Uint8Array> {
  try {
    // Prepare SSML
    const ssml = formatSSML(text, options)

    // Configure voice
    const voice = {
      languageCode: options.voice.language,
      name: options.voice.name,
      ssmlGender: options.voice.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'NEUTRAL'
    }

    // Configure audio
    const audioConfig = {
      audioEncoding: options.audio.format === 'mp3' ? 'MP3' : 'LINEAR16',
      speakingRate: options.voice.speakingRate,
      pitch: options.voice.pitch,
      effectsProfileId: options.audio.quality === 'high' ? ['large-home-entertainment-class-device'] : []
    }

    // Generate speech
    const [response] = await ttsClient.synthesizeSpeech({
      input: { ssml },
      voice,
      audioConfig
    })

    if (!response.audioContent) {
      throw new Error('No audio content generated')
    }

    return response.audioContent
  } catch (error) {
    logger.error('Failed to generate audio', error)
    throw new AppError('Failed to generate audio', 500, 'TTS_ERROR')
  }
}

function formatSSML(text: string, options: VoiceStoryRequest['options']): string {
  let ssml = '<speak>'
  
  // Add background music if requested
  if (options.audio?.includeMusic) {
    const musicVolume = options.audio.quality === 'high' ? '-15db' : '-20db'
    ssml += `<audio src="background-music.mp3" volume="${musicVolume}">`
  }

  // Process text for SSML with enhanced formatting
  const processedText = text
    // Add pauses for punctuation with varying durations
    .replace(/([.!?])\s+/g, '$1<break time="500ms"/>')
    .replace(/,/g, '<break time="250ms"/>')
    .replace(/;/g, '<break time="400ms"/>')
    .replace(/:/g, '<break time="300ms"/>')
    // Add emphasis for important words with varying levels
    .replace(/\*\*(.*?)\*\*/g, '<emphasis level="strong">$1</emphasis>')
    .replace(/\*(.*?)\*/g, '<emphasis level="moderate">$1</emphasis>')
    // Format dates with appropriate interpretation
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, '<say-as interpret-as="date" format="mdy">$1/$2/$3</say-as>')
    .replace(/(\d{4})/g, '<say-as interpret-as="date" format="yyyy">$1</say-as>')
    // Format numbers and measurements
    .replace(/\b(\d+)\b/g, '<say-as interpret-as="number">$1</say-as>')
    .replace(/(\d+)(?:st|nd|rd|th)\b/g, '<say-as interpret-as="ordinal">$1</say-as>')
    // Add prosody for emotional emphasis
    .replace(/!(\w+[^!]*)!/g, '<prosody rate="slow" pitch="+2st">$1</prosody>')
    // Format names and titles
    .replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+)\b/g, '<say-as interpret-as="title">$1</say-as> $2')
    // Add paragraph breaks
    .replace(/\n\n+/g, '<break time="800ms"/>')

  ssml += processedText

  // Add sound effects if requested
  if (options.audio?.includeEffects) {
    const effects = detectSoundEffects(text)
    for (const effect of effects) {
      ssml += `<audio src="${effect.file}" volume="${effect.volume}">`
    }
  }

  // Close background music if present
  if (options.audio?.includeMusic) {
    ssml += '</audio>'
  }

  ssml += '</speak>'
  return ssml
}

function detectSoundEffects(text: string): Array<{ file: string; volume: string }> {
  const effects: Array<{ file: string; volume: string }> = []
  const effectPatterns = [
    { pattern: /\b(birth|born|delivery)\b/i, file: 'birth.mp3', volume: '-15db' },
    { pattern: /\b(death|died|passed away)\b/i, file: 'death.mp3', volume: '-15db' },
    { pattern: /\b(married|wedding|ceremony)\b/i, file: 'wedding.mp3', volume: '-15db' },
    { pattern: /\b(war|battle|conflict)\b/i, file: 'battle.mp3', volume: '-20db' },
    { pattern: /\b(graduation|diploma|degree)\b/i, file: 'graduation.mp3', volume: '-15db' },
    { pattern: /\b(victory|triumph|success)\b/i, file: 'victory.mp3', volume: '-15db' },
    { pattern: /\b(journey|travel|voyage)\b/i, file: 'journey.mp3', volume: '-20db' },
    { pattern: /\b(celebration|party|festival)\b/i, file: 'celebration.mp3', volume: '-15db' }
  ]

  for (const { pattern, file, volume } of effectPatterns) {
    if (pattern.test(text)) {
      effects.push({ file, volume })
    }
  }

  return effects
}

function calculateAudioDuration(text: string, speakingRate: number): number {
  // Average speaking rate: 150 words per minute
  const words = text.split(/\s+/).length
  const pauses = (text.match(/[.!?,;:]/g) || []).length
  const paragraphs = (text.match(/\n\n+/g) || []).length
  
  // Base duration from words
  const baseDuration = (words / 150) * 60
  
  // Add time for pauses
  const pauseTime = (pauses * 0.5) + (paragraphs * 0.8)
  
  // Calculate final duration
  const totalDuration = (baseDuration + pauseTime) / speakingRate
  
  return Math.round(totalDuration)
}

async function uploadAudio(
  audioData: Uint8Array,
  format: string
): Promise<string> {
  try {
    const fileName = `stories/${crypto.randomUUID()}.${format}`
    const metadata = {
      contentType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
      cacheControl: '3600',
      upsert: false,
      metadata: {
        generated: new Date().toISOString(),
        format,
        size: audioData.length.toString()
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('voice-stories')
      .upload(fileName, audioData, metadata)

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('voice-stories')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    logger.error('Failed to upload audio', error)
    throw new AppError('Failed to upload audio', 500, 'STORAGE_ERROR')
  }
}

// Serve the function with middleware
serve(withErrorHandling(withCors(handleRequest))) 