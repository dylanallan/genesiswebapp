import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { verifyFamilyHistory } from '../lib/verification';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onStoryRecorded: (story: string, verification: any) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onStoryRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscript(transcript);
        setConfidence(event.results[0][0].confidence);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Speech recognition error. Please try again.');
        stopRecording();
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      recognitionRef.current?.start();
      setIsRecording(true);
      toast.success('Recording started. Share your family story...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && recognitionRef.current) {
      mediaRecorderRef.current.stop();
      recognitionRef.current.stop();
      setIsRecording(false);

      if (transcript) {
        setIsProcessing(true);
        try {
          const verification = await verifyFamilyHistory(transcript);
          onStoryRecorded(transcript, verification);
          
          if (verification.confidence < 0.8) {
            toast.info('Some details need verification. Suggested contacts have been added.');
          } else {
            toast.success('Story recorded and verified successfully!');
          }
        } catch (error) {
          console.error('Verification error:', error);
          toast.error('Error verifying the story. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Voice Story Recorder</h3>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`p-3 rounded-full transition-colors ${
            isRecording
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        >
          {isRecording ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Transcript:</h4>
              <p className="text-gray-600">{transcript}</p>
            </div>
            
            {confidence > 0 && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {(confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            )}
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center space-x-2 text-gray-500"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying story...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-gray-500 flex items-center space-x-1">
        <AlertCircle className="w-4 h-4" />
        <span>Speak clearly and provide dates and locations when possible</span>
      </div>
    </div>
  );
};