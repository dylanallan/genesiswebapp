import { corsFor } from "../_shared/cors.ts";
import { requireUser, requireActiveSubscription, json, errorResponse } from "../_shared/auth.ts";

// Text-to-speech with two interchangeable backends:
//  1. TTS_SERVER_URL  - any self-hosted, OpenAI-compatible speech server (e.g. Kokoro-FastAPI, Apache-2.0).
//                       Optional TTS_SERVER_KEY, TTS_MODEL (default "kokoro").
//  2. ELEVENLABS_API_KEY - hosted fallback; voices come from VOICE_ID_<LANG> env vars.
// Voices are chosen server-side from an allow-list so callers cannot run arbitrary voices on our account.
const MAX_CHARS = 2500;
const TTS_SERVER_URL = Deno.env.get("TTS_SERVER_URL")?.replace(/\/$/, "");
const TTS_SERVER_KEY = Deno.env.get("TTS_SERVER_KEY");
const TTS_MODEL = Deno.env.get("TTS_MODEL") ?? "kokoro";
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

// Neutral, descriptive voices (no real-person likenesses). Override with TTS_VOICES="id1,id2,...".
const OPEN_VOICES = (Deno.env.get("TTS_VOICES") ?? "af_heart,am_adam,bf_emma,bm_george").split(",").map((v) => v.trim());
const DEFAULT_OPEN_VOICE = OPEN_VOICES[0];

async function openServerSpeech(text: string, voice: string): Promise<Response> {
  return await fetch(`${TTS_SERVER_URL}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(TTS_SERVER_KEY ? { Authorization: `Bearer ${TTS_SERVER_KEY}` } : {}) },
    body: JSON.stringify({ model: TTS_MODEL, input: text, voice, response_format: "mp3" }),
  });
}

async function elevenLabsSpeech(text: string, language: string): Promise<Response> {
  const voiceId = Deno.env.get(`VOICE_ID_${language.toUpperCase().slice(0, 5)}`) ?? Deno.env.get("VOICE_ID_EN");
  if (!voiceId) return new Response("no voice", { status: 503 });
  return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
  });
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405, cors);
  try {
    const user = await requireUser(req);
    await requireActiveSubscription(user);

    if (!TTS_SERVER_URL && !ELEVENLABS_API_KEY) return json({ error: "Voice service is not configured" }, 503, cors);

    const { text, language = "en", voice } = await req.json();
    if (typeof text !== "string" || !text.trim()) return json({ error: "Missing text" }, 400, cors);
    if (text.length > MAX_CHARS) return json({ error: `Text too long (max ${MAX_CHARS} characters)` }, 400, cors);

    let ttsRes: Response;
    if (TTS_SERVER_URL) {
      const chosen = typeof voice === "string" && OPEN_VOICES.includes(voice) ? voice : DEFAULT_OPEN_VOICE;
      ttsRes = await openServerSpeech(text, chosen);
    } else {
      ttsRes = await elevenLabsSpeech(text, String(language));
    }

    if (!ttsRes.ok) {
      console.error("TTS provider error", ttsRes.status, await ttsRes.text());
      return json({ error: "Voice generation failed" }, 502, cors);
    }
    return new Response(ttsRes.body, {
      status: 200,
      headers: { ...cors, "Content-Type": "audio/mpeg", "Content-Disposition": "inline; filename=output.mp3" },
    });
  } catch (e) {
    return errorResponse(e, cors);
  }
});
