// Language and voice support
export const SUPPORTED_LANGUAGES = [
  'en-US', // English (US)
  'en-GB', // English (UK)
  'es-ES', // Spanish (Spain)
  'es-MX', // Spanish (Mexico)
  'fr-FR', // French (France)
  'fr-CA', // French (Canada)
  'de-DE', // German
  'it-IT', // Italian
  'pt-BR', // Portuguese (Brazil)
  'pt-PT', // Portuguese (Portugal)
  'ja-JP', // Japanese
  'ko-KR', // Korean
  'zh-CN', // Chinese (Mandarin)
  'zh-HK', // Chinese (Hong Kong)
  'zh-TW', // Chinese (Taiwan)
  'ru-RU', // Russian
  'nl-NL', // Dutch
  'pl-PL', // Polish
  'tr-TR', // Turkish
  'sv-SE', // Swedish
  'da-DK', // Danish
  'fi-FI', // Finnish
  'nb-NO', // Norwegian
  'hi-IN', // Hindi
  'ar-XA', // Arabic
  'he-IL', // Hebrew
  'id-ID', // Indonesian
  'ms-MY', // Malay
  'th-TH', // Thai
  'vi-VN'  // Vietnamese
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Voice configurations
export const VOICE_CONFIGS: Record<SupportedLanguage, Array<{
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
  recommended: boolean;
}>> = {
  'en-US': [
    { name: 'en-US-Neural2-A', gender: 'male', description: 'Standard US male voice', recommended: true },
    { name: 'en-US-Neural2-B', gender: 'male', description: 'Deep US male voice', recommended: false },
    { name: 'en-US-Neural2-C', gender: 'female', description: 'Standard US female voice', recommended: true },
    { name: 'en-US-Neural2-D', gender: 'male', description: 'Young US male voice', recommended: false },
    { name: 'en-US-Neural2-E', gender: 'female', description: 'Young US female voice', recommended: false },
    { name: 'en-US-Neural2-F', gender: 'female', description: 'Deep US female voice', recommended: false },
    { name: 'en-US-Neural2-G', gender: 'female', description: 'Soft US female voice', recommended: false },
    { name: 'en-US-Neural2-H', gender: 'female', description: 'Clear US female voice', recommended: false },
    { name: 'en-US-Neural2-I', gender: 'male', description: 'Strong US male voice', recommended: false },
    { name: 'en-US-Neural2-J', gender: 'male', description: 'Gentle US male voice', recommended: false }
  ],
  'en-GB': [
    { name: 'en-GB-Neural2-A', gender: 'female', description: 'Standard British female voice', recommended: true },
    { name: 'en-GB-Neural2-B', gender: 'male', description: 'Standard British male voice', recommended: true },
    { name: 'en-GB-Neural2-C', gender: 'female', description: 'Young British female voice', recommended: false },
    { name: 'en-GB-Neural2-D', gender: 'male', description: 'Young British male voice', recommended: false }
  ],
  'es-ES': [
    { name: 'es-ES-Neural2-A', gender: 'female', description: 'Standard Spanish female voice', recommended: true },
    { name: 'es-ES-Neural2-B', gender: 'male', description: 'Standard Spanish male voice', recommended: true },
    { name: 'es-ES-Neural2-C', gender: 'female', description: 'Young Spanish female voice', recommended: false },
    { name: 'es-ES-Neural2-D', gender: 'male', description: 'Young Spanish male voice', recommended: false },
    { name: 'es-ES-Neural2-E', gender: 'female', description: 'Deep Spanish female voice', recommended: false },
    { name: 'es-ES-Neural2-F', gender: 'male', description: 'Deep Spanish male voice', recommended: false }
  ],
  // Add more languages with their voice configurations...
  'ja-JP': [
    { name: 'ja-JP-Neural2-A', gender: 'female', description: 'Standard Japanese female voice', recommended: true },
    { name: 'ja-JP-Neural2-B', gender: 'male', description: 'Standard Japanese male voice', recommended: true },
    { name: 'ja-JP-Neural2-C', gender: 'female', description: 'Young Japanese female voice', recommended: false },
    { name: 'ja-JP-Neural2-D', gender: 'male', description: 'Young Japanese male voice', recommended: false }
  ],
  'zh-CN': [
    { name: 'cmn-CN-Neural2-A', gender: 'female', description: 'Standard Mandarin female voice', recommended: true },
    { name: 'cmn-CN-Neural2-B', gender: 'male', description: 'Standard Mandarin male voice', recommended: true },
    { name: 'cmn-CN-Neural2-C', gender: 'female', description: 'Young Mandarin female voice', recommended: false },
    { name: 'cmn-CN-Neural2-D', gender: 'male', description: 'Young Mandarin male voice', recommended: false }
  ]
} as const;

// Audio quality settings
export const AUDIO_QUALITY_SETTINGS = {
  high: {
    bitrate: '320k',
    sampleRate: 48000,
    effectsProfileId: ['large-home-entertainment-class-device'],
    volumeGainDb: 0
  },
  medium: {
    bitrate: '192k',
    sampleRate: 44100,
    effectsProfileId: ['handset-class-device'],
    volumeGainDb: -2
  },
  low: {
    bitrate: '128k',
    sampleRate: 22050,
    effectsProfileId: [],
    volumeGainDb: -4
  }
} as const;

// Story styles and tones
export const STORY_STYLES = [
  'narrative',
  'conversational',
  'historical',
  'personal',
  'documentary',
  'dramatic',
  'educational',
  'biographical'
] as const;

export const STORY_TONES = [
  'formal',
  'casual',
  'emotional',
  'educational',
  'inspirational',
  'humorous',
  'serious',
  'nostalgic'
] as const;

// Sound effects
export const SOUND_EFFECTS = {
  lifeEvents: [
    { pattern: /\b(birth|born|delivery)\b/i, file: 'birth.mp3', volume: '-15db', category: 'life' },
    { pattern: /\b(death|died|passed away)\b/i, file: 'death.mp3', volume: '-15db', category: 'life' },
    { pattern: /\b(married|wedding|ceremony)\b/i, file: 'wedding.mp3', volume: '-15db', category: 'life' },
    { pattern: /\b(graduation|diploma|degree)\b/i, file: 'graduation.mp3', volume: '-15db', category: 'achievement' }
  ],
  achievements: [
    { pattern: /\b(victory|triumph|success)\b/i, file: 'victory.mp3', volume: '-15db', category: 'achievement' },
    { pattern: /\b(award|honor|recognition)\b/i, file: 'award.mp3', volume: '-15db', category: 'achievement' },
    { pattern: /\b(discovery|invention|breakthrough)\b/i, file: 'discovery.mp3', volume: '-15db', category: 'achievement' }
  ],
  historical: [
    { pattern: /\b(war|battle|conflict)\b/i, file: 'battle.mp3', volume: '-20db', category: 'historical' },
    { pattern: /\b(revolution|rebellion|uprising)\b/i, file: 'revolution.mp3', volume: '-20db', category: 'historical' },
    { pattern: /\b(peace|treaty|agreement)\b/i, file: 'peace.mp3', volume: '-15db', category: 'historical' }
  ],
  travel: [
    { pattern: /\b(journey|travel|voyage)\b/i, file: 'journey.mp3', volume: '-20db', category: 'travel' },
    { pattern: /\b(arrival|destination|landing)\b/i, file: 'arrival.mp3', volume: '-15db', category: 'travel' },
    { pattern: /\b(departure|leaving|farewell)\b/i, file: 'departure.mp3', volume: '-15db', category: 'travel' }
  ],
  emotions: [
    { pattern: /\b(joy|happiness|celebration)\b/i, file: 'celebration.mp3', volume: '-15db', category: 'emotion' },
    { pattern: /\b(sadness|grief|mourning)\b/i, file: 'sadness.mp3', volume: '-20db', category: 'emotion' },
    { pattern: /\b(fear|danger|threat)\b/i, file: 'fear.mp3', volume: '-20db', category: 'emotion' },
    { pattern: /\b(hope|dream|aspiration)\b/i, file: 'hope.mp3', volume: '-15db', category: 'emotion' }
  ],
  nature: [
    { pattern: /\b(storm|thunder|lightning)\b/i, file: 'storm.mp3', volume: '-20db', category: 'nature' },
    { pattern: /\b(rain|shower|drizzle)\b/i, file: 'rain.mp3', volume: '-25db', category: 'nature' },
    { pattern: /\b(wind|breeze|gust)\b/i, file: 'wind.mp3', volume: '-25db', category: 'nature' },
    { pattern: /\b(ocean|sea|waves)\b/i, file: 'ocean.mp3', volume: '-20db', category: 'nature' }
  ]
} as const;

// Background music
export const BACKGROUND_MUSIC = {
  narrative: [
    { file: 'narrative-soft.mp3', volume: '-25db', mood: 'calm' },
    { file: 'narrative-dramatic.mp3', volume: '-20db', mood: 'dramatic' },
    { file: 'narrative-historical.mp3', volume: '-22db', mood: 'historical' }
  ],
  conversational: [
    { file: 'conversational-light.mp3', volume: '-25db', mood: 'light' },
    { file: 'conversational-warm.mp3', volume: '-22db', mood: 'warm' },
    { file: 'conversational-intimate.mp3', volume: '-20db', mood: 'intimate' }
  ],
  historical: [
    { file: 'historical-period.mp3', volume: '-20db', mood: 'period' },
    { file: 'historical-epic.mp3', volume: '-18db', mood: 'epic' },
    { file: 'historical-documentary.mp3', volume: '-22db', mood: 'documentary' }
  ],
  personal: [
    { file: 'personal-emotional.mp3', volume: '-22db', mood: 'emotional' },
    { file: 'personal-intimate.mp3', volume: '-20db', mood: 'intimate' },
    { file: 'personal-reflective.mp3', volume: '-25db', mood: 'reflective' }
  ]
} as const;

// Constants for processing
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // ms
export const MAX_STORY_LENGTH = 5000; // words
export const CACHE_DURATION = 3600000; // 1 hour in ms
export const MAX_AUDIO_DURATION = 3600; // 1 hour in seconds
export const MIN_AUDIO_DURATION = 10; // 10 seconds
export const DEFAULT_SPEAKING_RATE = 1.0;
export const DEFAULT_PITCH = 0.0;
export const DEFAULT_VOLUME = 0.0;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    STORY_DATA_REQUIRED: 'Story data is required',
    PERSON_NAME_REQUIRED: 'Person name is required when providing person data',
    FAMILY_NAME_REQUIRED: 'Family name is required when providing family data',
    UNSUPPORTED_LANGUAGE: 'Unsupported language',
    UNSUPPORTED_AUDIO_FORMAT: 'Unsupported audio format',
    STORY_TOO_LONG: 'Generated story exceeds maximum length',
    AUDIO_TOO_LONG: 'Generated audio exceeds maximum duration',
    AUDIO_TOO_SHORT: 'Generated audio is too short'
  },
  PROCESSING: {
    STORY_GENERATION_FAILED: 'Failed to generate story text',
    AUDIO_GENERATION_FAILED: 'Failed to generate audio',
    AUDIO_UPLOAD_FAILED: 'Failed to upload audio',
    STORAGE_ERROR: 'Storage operation failed',
    AI_ERROR: 'AI service error',
    TTS_ERROR: 'Text-to-speech service error'
  }
} as const; 