import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const DEFAULT_VOICE_ID = "morgan-freeman-style-id"; // Replace with actual ElevenLabs voice ID
const VOICE_MAP = {
  en: "morgan-freeman-style-id", // English (Morgan Freeman style)
  es: "antonio-voice-id",       // Spanish
  fr: "juliette-voice-id",     // French
  zh: "li-voice-id",           // Chinese
  hi: "arjun-voice-id",        // Hindi
  // ...add more voices as needed
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const { text, language = "en", voice } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
    }
    const voice_id = voice || VOICE_MAP[language] || DEFAULT_VOICE_ID;
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    });
    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }
    return new Response(ttsRes.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=output.mp3",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 