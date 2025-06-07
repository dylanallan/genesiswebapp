import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Play, Pause, Upload, Download, Users, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface VoiceProfile {
  id: string;
  name: string;
  relationship: string;
  audioSamples: string[];
  voiceModel: string;
  createdAt: Date;
}

export const VoiceCloning: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [storyText, setStoryText] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadVoiceSample(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started. Speak clearly for 30 seconds.');
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadVoiceSample = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const fileName = `voice-sample-${Date.now()}.wav`;
      
      const { data, error } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioBlob);

      if (error) throw error;

      // Process voice sample with AI
      const { data: processedVoice, error: processError } = await supabase.functions
        .invoke('process-voice-sample', {
          body: { audioPath: data.path }
        });

      if (processError) throw processError;

      toast.success('Voice sample processed successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process voice sample');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateVoiceStory = async () => {
    if (!selectedProfile || !storyText) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions
        .invoke('generate-voice-story', {
          body: {
            voiceProfileId: selectedProfile,
            text: storyText
          }
        });

      if (error) throw error;

      setGeneratedAudio(data.audioUrl);
      toast.success('Voice story generated!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate voice story');
    } finally {
      setIsProcessing(false);
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
          <h3 className="font-medium text-gray-900">Record Voice Sample</h3>
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
            <p className="text-sm text-gray-600">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Generate Voice Story</h3>
          <select
            value={selectedProfile || ''}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select voice profile</option>
            {voiceProfiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.relationship})
              </option>
            ))}
          </select>
          
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="Enter the story text to be spoken in their voice..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={4}
          />
          
          <button
            onClick={generateVoiceStory}
            disabled={!selectedProfile || !storyText || isProcessing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? 'Generating...' : 'Generate Voice Story'}
          </button>

          {generatedAudio && (
            <audio controls className="w-full">
              <source src={generatedAudio} type="audio/mpeg" />
            </audio>
          )}
        </div>
      </div>
    </div>
  );
};