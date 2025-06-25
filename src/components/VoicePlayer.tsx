import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  // ...add more as needed
];

type Voice = { id: string; label: string };

type VoicesMap = {
  [key: string]: Voice[];
};

const VOICES: VoicesMap = {
  en: [
    { id: "morgan-freeman-style-id", label: "Morgan Freeman (English)" },
    // ...other English voices
  ],
  es: [
    { id: "antonio-voice-id", label: "Antonio (Spanish)" },
    // ...other Spanish voices
  ],
  fr: [
    { id: "juliette-voice-id", label: "Juliette (French)" },
  ],
  zh: [
    { id: "li-voice-id", label: "Li (Chinese)" },
  ],
  hi: [
    { id: "arjun-voice-id", label: "Arjun (Hindi)" },
  ],
  // ...other languages
};

interface VoicePlayerProps {
  text: string;
  defaultLanguage?: string;
  defaultVoice?: string;
}

export default function VoicePlayer({ text, defaultLanguage = "en", defaultVoice = "morgan-freeman-style-id" }: VoicePlayerProps) {
  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [voice, setVoice] = useState<string>(defaultVoice);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handlePlay = async () => {
    setLoading(true);
    setAudioUrl(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('voice-synthesis', {
        body: { text, language, voice }
      });
      
      if (error) {
        console.error('Voice synthesis error:', error);
        throw error;
      }
      
      // Convert the response to a blob
      const response = await fetch(data.url || data);
      const blob = await response.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Failed to synthesize voice:', error);
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={language} onChange={e => {
          const lang = e.target.value;
          setLanguage(lang);
          setVoice(VOICES[lang][0]?.id || "");
        }}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <select value={voice} onChange={e => setVoice(e.target.value)}>
          {(VOICES[language] || []).map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <button onClick={handlePlay} disabled={loading}>{loading ? "Loading..." : "Play"}</button>
      </div>
      {audioUrl && <audio src={audioUrl} controls autoPlay />}
    </div>
  );
} 