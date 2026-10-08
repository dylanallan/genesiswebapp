import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// Voice ids must match the server allow-list (TTS_VOICES in the voice-synthesis function).
const VOICES = [
  { id: "af_heart", label: "Heart (warm, female, American)" },
  { id: "am_adam", label: "Adam (steady, male, American)" },
  { id: "bf_emma", label: "Emma (clear, female, British)" },
  { id: "bm_george", label: "George (calm, male, British)" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
];

interface VoicePlayerProps {
  text: string;
  defaultLanguage?: string;
  defaultVoice?: string;
}

export default function VoicePlayer({ text, defaultLanguage = "en", defaultVoice = VOICES[0].id }: VoicePlayerProps) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [voice, setVoice] = useState(defaultVoice);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  // Free the previous audio blob when replaced or when the component unmounts.
  useEffect(() => {
    urlRef.current = audioUrl;
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [audioUrl]);

  const speakWithBrowser = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlay = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setAudioUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("voice-synthesis", {
        body: { text, language, voice },
      });
      if (error) {
        // Surface the server's own message (e.g. "An active subscription is required")
        let message = "Voice generation failed";
        try {
          const body = await (error as { context?: Response }).context?.json();
          if (body?.error) message = body.error;
        } catch { /* keep default message */ }
        toast.error(message);
        speakWithBrowser();
        return;
      }
      // Audio responses arrive as a Blob
      const blob = data instanceof Blob ? data : new Blob([data], { type: "audio/mpeg" });
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Failed to synthesize voice:", err);
      toast.error("Could not reach the voice service. Using your browser's voice instead.");
      speakWithBrowser();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <select aria-label="Language" className="border rounded px-2 py-1" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <select aria-label="Voice" className="border rounded px-2 py-1" value={voice} onChange={(e) => setVoice(e.target.value)}>
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
        <button className="bg-blue-600 text-white rounded px-3 py-1 disabled:opacity-50" onClick={handlePlay} disabled={loading || !text.trim()}>
          {loading ? "Generating…" : "Play"}
        </button>
      </div>
      {audioUrl && <audio src={audioUrl} controls autoPlay />}
    </div>
  );
}
