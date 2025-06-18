import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Play, Pause, Save, Trash, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 60,
  className
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, url);
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone. Please check your permissions.');
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success('Recording stopped');
    }
  };

  const playRecording = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err);
        toast.error('Playback failed');
      });
      setIsPlaying(true);
    }
  };

  const saveRecording = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    try {
      const fileName = `voice-recording-${Date.now()}.webm`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);
      
      toast.success('Recording saved successfully');
      
      // Return the public URL if needed
      if (onRecordingComplete) {
        onRecordingComplete(audioBlob, urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    
    toast.info('Recording deleted');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4">
        {error && (
          <div className="bg-red-50 p-3 rounded-lg mb-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center">
          {!audioUrl ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } transition-colors`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
              
              {isRecording && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-500">{formatTime(recordingTime)}</div>
                  <div className="text-sm text-gray-500">
                    {maxDuration - recordingTime} seconds remaining
                  </div>
                </div>
              )}
              
              {!isRecording && (
                <p className="text-sm text-gray-500">
                  Click to start recording (max {maxDuration} seconds)
                </p>
              )}
            </>
          ) : (
            <>
              <div className="w-full mb-4">
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={playRecording}
                    className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    {formatTime(recordingTime)} recorded
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={saveRecording}
                    disabled={isProcessing}
                    className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                  
                  <button
                    onClick={deleteRecording}
                    disabled={isProcessing}
                    className="flex items-center space-x-1 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    <Trash className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => {
                  deleteRecording();
                  startRecording();
                }}
                disabled={isProcessing}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Record again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};