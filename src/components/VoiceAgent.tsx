import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2, Play, Pause, Volume2, VolumeX, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { streamResponse } from '../lib/ai';

interface VoiceAgentProps {
  userName?: string;
  ancestry?: string;
  businessGoals?: string;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ 
  userName = 'User', 
  ancestry = 'European and Asian heritage',
  businessGoals = 'Automate marketing and preserve cultural knowledge'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voice: 'en-US-Standard-J',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    initializeSpeechRecognition();
    initializeSpeechSynthesis();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current && utteranceRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
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
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // If we're still supposed to be listening, restart
          recognitionRef.current?.start();
        }
      };
    }
  };

  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Process the final transcript
      if (transcript) {
        processVoiceInput(transcript);
      }
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      toast.success('Listening... Speak now');
    }
  };

  const processVoiceInput = async (input: string) => {
    setIsProcessing(true);
    try {
      let fullResponse = '';
      
      // Use the AI streaming function
      for await (const chunk of streamResponse(
        `User ${userName} with ancestry ${ancestry} and business goals ${businessGoals} says: ${input}`,
        'gpt-4'
      )) {
        fullResponse += chunk;
      }
      
      setResponse(fullResponse);
      
      // Speak the response if not muted
      if (!isMuted) {
        speakResponse(fullResponse);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const fallbackResponse = "I'm sorry, I encountered an error processing your request. Please try again.";
      setResponse(fallbackResponse);
      
      if (!isMuted) {
        speakResponse(fallbackResponse);
      }
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) {
      toast.error('Speech synthesis is not supported in your browser');
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Create a new utterance
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    utteranceRef.current.voice = synthRef.current.getVoices().find(voice => voice.name === voiceSettings.voice) || null;
    utteranceRef.current.rate = voiceSettings.rate;
    utteranceRef.current.pitch = voiceSettings.pitch;
    utteranceRef.current.volume = voiceSettings.volume;

    // Set event handlers
    utteranceRef.current.onstart = () => setIsSpeaking(true);
    utteranceRef.current.onend = () => setIsSpeaking(false);
    utteranceRef.current.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      toast.error('Error during speech synthesis');
    };

    // Start speaking
    synthRef.current.speak(utteranceRef.current);
  };

  const toggleSpeaking = () => {
    if (!synthRef.current) return;
    
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else if (response) {
      speakResponse(response);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (isSpeaking && !isMuted) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Mic className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">Voice Agent</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-colors ${
                isMuted 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
              isListening
                ? 'bg-red-500 text-white'
                : 'bg-purple-500 text-white'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </motion.button>
          
          <p className="mt-4 text-gray-700 font-medium">
            {isListening 
              ? 'Listening...' 
              : isProcessing 
                ? 'Processing...' 
                : 'Tap to speak'}
          </p>
          
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-purple-50 rounded-lg max-w-md w-full"
            >
              <p className="text-purple-800">{transcript}</p>
            </motion.div>
          )}
          
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">Response</h4>
                <button
                  onClick={toggleSpeaking}
                  className={`p-1 rounded-full ${
                    isSpeaking 
                      ? 'bg-blue-200 text-blue-700' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-blue-800">{response}</p>
            </motion.div>
          )}
        </div>

        {/* Voice Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Voice Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Voice
                    </label>
                    <select
                      value={voiceSettings.voice}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, voice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en-US-Standard-J">Male (US)</option>
                      <option value="en-US-Standard-E">Female (US)</option>
                      <option value="en-GB-Standard-B">Male (UK)</option>
                      <option value="en-GB-Standard-A">Female (UK)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Speed: {voiceSettings.rate.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSettings.rate}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Pitch: {voiceSettings.pitch.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSettings.pitch}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Volume: {voiceSettings.volume.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.volume}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        speakResponse("This is a test of the voice settings you've selected.");
                        toast.success('Testing voice settings');
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Test Voice
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setVoiceSettings({
                        voice: 'en-US-Standard-J',
                        rate: 1.0,
                        pitch: 1.0,
                        volume: 1.0
                      });
                      toast.info('Voice settings reset to default');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset to Default
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      toast.success('Voice settings saved');
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};