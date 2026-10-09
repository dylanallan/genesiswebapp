import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, Mic, Loader2, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { uploadOwnFile } from '../lib/storage';

// Ancestral voice preservation: record a family member (with their consent), keep their voice,
// and have it read stories aloud. Backed by the voice-clone Edge Function.
interface VoiceProfile {
  id: string;
  name: string;
  relationship: string | null;
  created_at: string;
}

const CONSENT_TEXT = "I am this person, or I have their permission, to record and recreate their voice for my family's private use.";

async function callVoice<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('voice-clone', { body });
  if (error) {
    let message = 'Something went wrong. Please try again.';
    try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) message = b.error; } catch { /* default */ }
    throw new Error(message);
  }
  return data as T;
}

export const VoiceCloning: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [consent, setConsent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('voice_profiles').select('id,name,relationship,created_at').order('created_at', { ascending: false });
    if (error) return toast.error('Could not load saved voices');
    setVoiceProfiles((data ?? []) as VoiceProfile[]);
  }, []);

  useEffect(() => { void loadProfiles(); }, [loadProfiles]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const createVoice = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const ext = audioBlob.type.includes('mp4') ? 'm4a' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      const samplePath = await uploadOwnFile('voice-samples', `voice-sample.${ext}`, audioBlob, audioBlob.type || 'audio/webm');
      const { profile } = await callVoice<{ profile: VoiceProfile }>({ action: 'create', name, relationship, samplePath, consent: true });
      toast.success(`${profile.name}'s voice has been preserved`);
      setName('');
      setRelationship('');
      setConsent(false);
      setSelectedProfile(profile.id);
      await loadProfiles();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (!name.trim()) return toast.error('First enter whose voice this is');
    if (!consent) return toast.error('Please confirm you have permission to record this voice');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await createVoice(audioBlob);
      };
      recorder.start();
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setIsRecording(true);
      toast.info('Recording. Read or talk naturally for at least 30 seconds.');
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Could not use the microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (seconds < 30 && !window.confirm('Recordings under 30 seconds usually sound poor. Stop anyway?')) return;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const generateVoiceStory = async () => {
    if (!selectedProfile || !storyText.trim()) return;
    setIsProcessing(true);
    setGeneratedAudio(null);
    try {
      const { audioUrl } = await callVoice<{ audioUrl: string }>({ action: 'speak', profileId: selectedProfile, text: storyText });
      setGeneratedAudio(audioUrl);
      toast.success('Voice story generated!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const playSample = async (id: string) => {
    try {
      const { audioUrl } = await callVoice<{ audioUrl: string }>({ action: 'sample', profileId: id });
      if (audioUrl) void new Audio(audioUrl).play();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteVoice = async (profile: VoiceProfile) => {
    if (!window.confirm(`Delete ${profile.name}'s voice? The recording and the recreated voice are removed permanently.`)) return;
    try {
      await callVoice({ action: 'delete', profileId: profile.id });
      if (selectedProfile === profile.id) setSelectedProfile(null);
      toast.success('Voice deleted');
      await loadProfiles();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Heart className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-semibold">Ancestral Voice Preservation</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Preserve a voice</h3>
          <div className="grid grid-cols-2 gap-2">
            <input aria-label="Name" className="border rounded-lg px-3 py-2" placeholder="Whose voice? (e.g. Grandma Rosa)" value={name} onChange={(e) => setName(e.target.value)} disabled={isRecording || isProcessing} />
            <input aria-label="Relationship" className="border rounded-lg px-3 py-2" placeholder="Relationship (optional)" value={relationship} onChange={(e) => setRelationship(e.target.value)} disabled={isRecording || isProcessing} />
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={isRecording || isProcessing} />
            {CONSENT_TEXT}
          </label>
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} disabled:opacity-50`}
            >
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-sm text-gray-600">
              {isProcessing ? 'Creating the voice…' : isRecording ? `Recording… ${seconds}s (aim for 30–60s). Click to stop.` : 'Click to start recording'}
            </p>
          </div>

          {voiceProfiles.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {voiceProfiles.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{p.name}{p.relationship ? ` — ${p.relationship}` : ''}</span>
                  <span className="flex gap-2">
                    <button onClick={() => playSample(p.id)} aria-label={`Play ${p.name}'s recording`} className="text-blue-600"><Play className="w-4 h-4" /></button>
                    <button onClick={() => deleteVoice(p)} aria-label={`Delete ${p.name}'s voice`} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Generate Voice Story</h3>
          <select
            aria-label="Voice"
            value={selectedProfile || ''}
            onChange={(e) => setSelectedProfile(e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">{voiceProfiles.length ? 'Select a voice' : 'Preserve a voice first'}</option>
            {voiceProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}{profile.relationship ? ` (${profile.relationship})` : ''}
              </option>
            ))}
          </select>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value.slice(0, 2500))}
            placeholder="Enter the story text to be spoken in their voice..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={4}
          />
          <p className="text-xs text-gray-500 text-right">{storyText.length}/2500</p>
          <button
            onClick={generateVoiceStory}
            disabled={!selectedProfile || !storyText.trim() || isProcessing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? 'Generating...' : 'Generate Voice Story'}
          </button>
          {generatedAudio && <audio controls className="w-full" src={generatedAudio} />}
          <p className="text-xs text-gray-500">Voice preservation is a Pro feature. Voices are private to your account and can be deleted at any time.</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloning;
