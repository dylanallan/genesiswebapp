import { assertEquals, assertExists, assertThrows } from 'std/testing/asserts.ts';
import { createClient } from '@supabase/supabase-js';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { AppError } from '../shared/error-handler.ts';
import {
  SUPPORTED_LANGUAGES,
  VOICE_CONFIGS,
  AUDIO_QUALITY_SETTINGS,
  STORY_STYLES,
  STORY_TONES,
  SOUND_EFFECTS,
  BACKGROUND_MUSIC,
  MAX_STORY_LENGTH,
  MAX_AUDIO_DURATION,
  MIN_AUDIO_DURATION,
  ERROR_MESSAGES,
  type SupportedLanguage
} from './constants.ts';
import { handleRequest } from './index.ts';

// Mock dependencies
const mockSupabase = {
  from: () => ({
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({
          data: {
            id: 'test-story-id',
            story_text: 'Test story text',
            audio_url: 'https://example.com/audio.mp3',
            duration: 120,
            word_count: 100,
            voice_name: 'en-US-Neural2-A',
            language: 'en-US',
            style: 'narrative',
            tone: 'formal',
            audio_format: 'MP3',
            audio_quality: 'medium',
            processing_status: 'completed',
            metadata: {}
          },
          error: null
        })
      })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/audio.mp3' } })
      })
    }
  })
};

const mockTtsClient = {
  synthesizeSpeech: () => Promise.resolve([{
    audioContent: new Uint8Array([1, 2, 3, 4, 5])
  }])
};

const mockAiService = {
  generateText: (prompt: string) => Promise.resolve('Generated story text')
};

// Test data
const validRequest = {
  data: {
    person: {
      name: 'John Smith',
      birthDate: '1990-01-01',
      birthPlace: 'New York',
      lifeEvents: [
        {
          date: '2010-01-01',
          description: 'Graduated from university',
          type: 'education'
        }
      ]
    }
  },
  options: {
    language: 'en-US' as SupportedLanguage,
    voice: {
      gender: 'male' as const
    },
    style: 'narrative' as const,
    tone: 'formal' as const,
    audioFormat: 'MP3' as const,
    audioQuality: 'medium' as const,
    speakingRate: 1.0,
    pitch: 0.0,
    volume: 0.0,
    includeSoundEffects: true,
    includeBackgroundMusic: true
  }
};

// Test suite
Deno.test('Voice Story Generator', async (t) => {
  // Test request validation
  await t.step('validates request data', () => {
    assertThrows(
      () => validateRequest({ data: {} as any }),
      AppError,
      ERROR_MESSAGES.VALIDATION.STORY_DATA_REQUIRED
    );

    assertThrows(
      () => validateRequest({
        data: { person: { name: '' } },
        options: { language: 'invalid' as any }
      }),
      AppError,
      ERROR_MESSAGES.VALIDATION.UNSUPPORTED_LANGUAGE
    );

    assertThrows(
      () => validateRequest({
        data: { person: { name: 'John' } },
        options: { audioFormat: 'invalid' as any }
      }),
      AppError,
      ERROR_MESSAGES.VALIDATION.UNSUPPORTED_AUDIO_FORMAT
    );
  });

  // Test voice selection
  await t.step('selects appropriate voice', () => {
    const voice = selectVoice('en-US', 'male');
    assertExists(voice);
    assertEquals(typeof voice, 'string');
    assertExists(VOICE_CONFIGS['en-US'].find(v => v.name === voice));

    // Test cache
    const cachedVoice = selectVoice('en-US', 'male');
    assertEquals(voice, cachedVoice);
  });

  // Test story generation
  await t.step('generates story text', async () => {
    const storyText = await generateStoryText(validRequest);
    assertExists(storyText);
    assertEquals(typeof storyText, 'string');
    assert(storyText.length > 0);
    assert(storyText.split(/\s+/).length <= MAX_STORY_LENGTH);

    // Test with different story types
    const familyStory = await generateStoryText({
      ...validRequest,
      data: {
        family: {
          name: 'Smith Family',
          members: [
            { name: 'John', relationship: 'father' },
            { name: 'Jane', relationship: 'mother' }
          ]
        }
      }
    });
    assertExists(familyStory);
    assert(familyStory.includes('Smith Family'));

    const historicalStory = await generateStoryText({
      ...validRequest,
      data: {
        historical: {
          period: 'World War II',
          events: [
            {
              date: '1945-05-08',
              description: 'Victory in Europe',
              significance: 'End of war in Europe'
            }
          ]
        }
      }
    });
    assertExists(historicalStory);
    assert(historicalStory.includes('World War II'));
  });

  // Test SSML formatting
  await t.step('formats SSML correctly', () => {
    const text = 'This is a test sentence. It has important words.';
    const ssml = formatSSML(text, validRequest.options);
    
    assertExists(ssml);
    assert(ssml.includes('<speak'));
    assert(ssml.includes('<voice'));
    assert(ssml.includes('important'));
    assert(ssml.includes('<break'));
    
    // Test sound effects
    const textWithEffects = 'The storm raged on. Thunder crashed.';
    const ssmlWithEffects = formatSSML(textWithEffects, {
      ...validRequest.options,
      includeSoundEffects: true
    });
    assert(ssmlWithEffects.includes('<audio'));
    assert(ssmlWithEffects.includes('storm.mp3'));
  });

  // Test audio generation
  await t.step('generates audio', async () => {
    const ssml = formatSSML('Test audio generation.', validRequest.options);
    const { audioContent, duration } = await generateAudio(ssml, validRequest.options);
    
    assertExists(audioContent);
    assert(audioContent instanceof Uint8Array);
    assert(duration > 0);
    assert(duration <= MAX_AUDIO_DURATION);
    assert(duration >= MIN_AUDIO_DURATION);

    // Test different audio qualities
    const highQuality = await generateAudio(ssml, {
      ...validRequest.options,
      audioQuality: 'high'
    });
    assertExists(highQuality.audioContent);

    const lowQuality = await generateAudio(ssml, {
      ...validRequest.options,
      audioQuality: 'low'
    });
    assertExists(lowQuality.audioContent);
  });

  // Test audio upload
  await t.step('uploads audio successfully', async () => {
    const audioContent = new Uint8Array([1, 2, 3, 4, 5]);
    const url = await uploadAudio(audioContent, validRequest.options);
    
    assertExists(url);
    assert(url.startsWith('https://'));
    assert(url.endsWith('.mp3'));
  });

  // Test full request handling
  await t.step('handles complete request', async () => {
    const response = await handleRequest(validRequest);
    
    assertExists(response);
    assertEquals(typeof response.id, 'string');
    assertEquals(typeof response.storyText, 'string');
    assertEquals(typeof response.audioUrl, 'string');
    assertEquals(typeof response.duration, 'number');
    assertEquals(typeof response.wordCount, 'number');
    
    assertExists(response.metadata);
    assertEquals(response.metadata.language, validRequest.options.language);
    assertEquals(response.metadata.style, validRequest.options.style);
    assertEquals(response.metadata.tone, validRequest.options.tone);
    assertEquals(response.metadata.audioFormat, validRequest.options.audioFormat);
    assertEquals(response.metadata.audioQuality, validRequest.options.audioQuality);
    
    // Test sound effects
    assert(Array.isArray(response.metadata.soundEffects));
    
    // Test background music
    if (validRequest.options.includeBackgroundMusic) {
      assertExists(response.metadata.backgroundMusic);
      assertExists(response.metadata.backgroundMusic.file);
      assertExists(response.metadata.backgroundMusic.mood);
    }
  });

  // Test error handling
  await t.step('handles errors appropriately', async () => {
    // Test story too long
    const longStoryRequest = {
      ...validRequest,
      data: {
        custom: {
          title: 'Long Story',
          content: 'word '.repeat(MAX_STORY_LENGTH + 1)
        }
      }
    };
    
    assertThrows(
      () => generateStoryText(longStoryRequest),
      AppError,
      ERROR_MESSAGES.VALIDATION.STORY_TOO_LONG
    );

    // Test audio generation failure
    const mockTtsError = {
      synthesizeSpeech: () => Promise.reject(new Error('TTS service error'))
    };
    
    assertThrows(
      () => generateAudio('test', validRequest.options),
      AppError,
      ERROR_MESSAGES.PROCESSING.AUDIO_GENERATION_FAILED
    );

    // Test audio upload failure
    const mockStorageError = {
      from: () => ({
        storage: {
          from: () => ({
            upload: () => Promise.resolve({ error: new Error('Upload failed') })
          })
        }
      })
    };
    
    assertThrows(
      () => uploadAudio(new Uint8Array([1, 2, 3]), validRequest.options),
      AppError,
      ERROR_MESSAGES.PROCESSING.AUDIO_UPLOAD_FAILED
    );
  });

  // Test retry logic
  await t.step('implements retry logic', async () => {
    let attempts = 0;
    const failingOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await withRetry(failingOperation);
    assertEquals(result, 'success');
    assertEquals(attempts, 3);
  });

  // Test language support
  await t.step('supports all configured languages', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const voice = selectVoice(language);
      assertExists(voice);
      assertExists(VOICE_CONFIGS[language]);
    }
  });

  // Test audio quality settings
  await t.step('supports all audio quality settings', () => {
    for (const quality of Object.keys(AUDIO_QUALITY_SETTINGS)) {
      const settings = AUDIO_QUALITY_SETTINGS[quality as keyof typeof AUDIO_QUALITY_SETTINGS];
      assertExists(settings.bitrate);
      assertExists(settings.sampleRate);
      assertExists(settings.effectsProfileId);
      assertExists(settings.volumeGainDb);
    }
  });

  // Test story styles and tones
  await t.step('supports all story styles and tones', () => {
    for (const style of STORY_STYLES) {
      const request = {
        ...validRequest,
        options: { ...validRequest.options, style }
      };
      assertThrows(() => validateRequest(request), AppError);
    }

    for (const tone of STORY_TONES) {
      const request = {
        ...validRequest,
        options: { ...validRequest.options, tone }
      };
      assertThrows(() => validateRequest(request), AppError);
    }
  });

  // Test sound effects
  await t.step('supports all sound effect categories', () => {
    for (const category of Object.values(SOUND_EFFECTS)) {
      for (const effect of category) {
        assertExists(effect.pattern);
        assertExists(effect.file);
        assertExists(effect.volume);
        assertExists(effect.category);
      }
    }
  });

  // Test background music
  await t.step('supports all background music styles', () => {
    for (const style of Object.keys(BACKGROUND_MUSIC)) {
      const music = BACKGROUND_MUSIC[style as keyof typeof BACKGROUND_MUSIC];
      assert(Array.isArray(music));
      for (const track of music) {
        assertExists(track.file);
        assertExists(track.volume);
        assertExists(track.mood);
      }
    }
  });
}); 