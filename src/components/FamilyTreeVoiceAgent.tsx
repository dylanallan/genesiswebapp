import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  X,
  Users,
  UserPlus,
  FileTree,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { streamResponse } from '../lib/ai';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  notes?: string;
  confidence: number;
  source: 'user' | 'ai' | 'validated';
}

interface FamilyTreeVoiceAgentProps {
  userName?: string;
  ancestry?: string;
}

export const FamilyTreeVoiceAgent: React.FC<FamilyTreeVoiceAgentProps> = ({ 
  userName = 'User', 
  ancestry = 'European and Asian heritage'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<FamilyMember[]>([]);
  const [showFamilyTree, setShowFamilyTree] = useState(false);
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
    loadFamilyMembers();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current && utteranceRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const loadFamilyMembers = async () => {
    try {
      // In a real implementation, fetch from database
      // For demo, we'll use mock data
      const mockFamilyMembers: FamilyMember[] = [
        {
          id: '1',
          name: 'Maria Elena Rodriguez',
          relationship: 'Great-grandmother',
          birthDate: '1920-03-15',
          birthPlace: 'Tuscany, Italy',
          deathDate: '1995-11-22',
          deathPlace: 'New York, USA',
          notes: 'Immigrated to the United States in 1945',
          confidence: 0.95,
          source: 'validated'
        },
        {
          id: '2',
          name: 'Giuseppe Rodriguez',
          relationship: 'Great-grandfather',
          birthDate: '1918-06-20',
          birthPlace: 'Sicily, Italy',
          deathDate: '1980-04-10',
          deathPlace: 'New York, USA',
          notes: 'Worked as a carpenter after immigration',
          confidence: 0.92,
          source: 'validated'
        },
        {
          id: '3',
          name: 'Robert Chen',
          relationship: 'Grandfather',
          birthDate: '1945-09-12',
          birthPlace: 'San Francisco, USA',
          confidence: 0.88,
          source: 'user'
        }
      ];
      
      setFamilyMembers(mockFamilyMembers);
    } catch (error) {
      console.error('Error loading family members:', error);
      toast.error('Failed to load family tree');
    }
  };

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
      toast.success('Listening... Tell me about your family history');
    }
  };

  const processVoiceInput = async (input: string) => {
    setIsProcessing(true);
    try {
      let fullResponse = '';
      
      // Use the AI streaming function with a specialized prompt for family tree analysis
      for await (const chunk of streamResponse(
        `You are a genealogy and family history expert. Analyze this conversation about family history and extract any relevant information about family members, relationships, dates, and locations. The user's known ancestry is ${ancestry}.
        
        User says: ${input}
        
        First, provide a helpful response about the information shared. Then, extract any family members mentioned with the following details (if available):
        - Name
        - Relationship to the user
        - Birth date and place
        - Death date and place (if applicable)
        - Any other notable information
        
        Format the extracted information clearly and indicate your confidence level for each piece of information.`,
        'claude-3-opus'
      )) {
        fullResponse += chunk;
      }
      
      setResponse(fullResponse);
      
      // Extract family members from the response
      const extractedMembers = extractFamilyMembers(fullResponse, input);
      if (extractedMembers.length > 0) {
        setPendingMembers(extractedMembers);
      }
      
      // Speak the response if not muted
      if (!isMuted) {
        speakResponse(fullResponse);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const fallbackResponse = "I'm sorry, I encountered an error processing your family history information. Please try again.";
      setResponse(fallbackResponse);
      
      if (!isMuted) {
        speakResponse(fallbackResponse);
      }
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const extractFamilyMembers = (aiResponse: string, userInput: string): FamilyMember[] => {
    const members: FamilyMember[] = [];
    
    // Look for patterns that might indicate family members
    // This is a simplified version - in a real implementation, you would use more sophisticated NLP
    
    // Look for name patterns
    const nameRegex = /([A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+)/g;
    const names = userInput.match(nameRegex) || [];
    
    // Look for relationship patterns
    const relationshipTerms = [
      'mother', 'father', 'grandmother', 'grandfather', 'aunt', 'uncle', 
      'sister', 'brother', 'cousin', 'daughter', 'son', 'niece', 'nephew',
      'great-grandmother', 'great-grandfather'
    ];
    
    // Look for date patterns
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g;
    const dates = userInput.match(dateRegex) || [];
    
    // Look for location patterns
    const locationRegex = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*,? (?:[A-Z]{2}|[A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g;
    const locations = userInput.match(locationRegex) || [];
    
    // For each name found, try to determine if it's a family member
    names.forEach((name, index) => {
      // Check if this name appears near a relationship term
      let relationship = '';
      for (const term of relationshipTerms) {
        if (userInput.toLowerCase().includes(`${term} ${name.toLowerCase()}`) || 
            userInput.toLowerCase().includes(`${name.toLowerCase()} ${term}`)) {
          relationship = term;
          break;
        }
      }
      
      if (relationship || index < 2) { // Assume first couple names are family members even without explicit relationship
        const member: FamilyMember = {
          id: `pending-${Date.now()}-${index}`,
          name,
          relationship: relationship || 'Unknown',
          confidence: relationship ? 0.85 : 0.6,
          source: 'ai'
        };
        
        // Try to associate dates and locations
        if (dates.length > 0 && index < dates.length) {
          member.birthDate = dates[index];
        }
        
        if (locations.length > 0 && index < locations.length) {
          member.birthPlace = locations[index];
        }
        
        members.push(member);
      }
    });
    
    // If we couldn't extract members with the simple approach, try to parse the AI's structured output
    if (members.length === 0) {
      // Look for sections that might contain extracted information
      const extractionSections = aiResponse.split(/extracted information|family members|extracted details/i);
      if (extractionSections.length > 1) {
        const extractedContent = extractionSections[1];
        
        // Look for name patterns in the AI's structured output
        const nameMatches = extractedContent.match(nameRegex);
        if (nameMatches) {
          nameMatches.forEach((name, index) => {
            // Try to find relationship near this name
            let relationship = 'Unknown';
            for (const term of relationshipTerms) {
              if (extractedContent.toLowerCase().includes(`${term}.*?${name.toLowerCase()}`) || 
                  extractedContent.toLowerCase().includes(`${name.toLowerCase()}.*?${term}`)) {
                relationship = term;
                break;
              }
            }
            
            const member: FamilyMember = {
              id: `pending-${Date.now()}-${index}`,
              name,
              relationship,
              confidence: 0.7,
              source: 'ai'
            };
            
            members.push(member);
          });
        }
      }
    }
    
    return members;
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

  const addToFamilyTree = (member: FamilyMember) => {
    // Add to family tree
    setFamilyMembers(prev => [...prev, {...member, source: 'validated'}]);
    
    // Remove from pending
    setPendingMembers(prev => prev.filter(m => m.id !== member.id));
    
    toast.success(`Added ${member.name} to your family tree`);
  };

  const rejectFamilyMember = (memberId: string) => {
    setPendingMembers(prev => prev.filter(m => m.id !== memberId));
    toast.info('Entry rejected');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Mic className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Family Tree Voice Agent</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFamilyTree(!showFamilyTree)}
              className={`p-2 rounded-lg transition-colors ${
                showFamilyTree 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileTree className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-colors ${
                isMuted 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFamilyTree ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Your Family Tree</h3>
              <button
                onClick={() => setShowFamilyTree(false)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Back to Voice Agent
              </button>
            </div>
            
            {familyMembers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">No family members yet</h4>
                <p className="text-gray-500">Start by telling the voice agent about your family history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {familyMembers.map(member => (
                  <div 
                    key={member.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-blue-600">{member.relationship}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          member.source === 'validated' 
                            ? 'bg-green-100 text-green-800' 
                            : member.source === 'user'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.source === 'validated' ? 'Validated' : 
                           member.source === 'user' ? 'User Added' : 'AI Detected'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      {member.birthDate && (
                        <div>
                          <span className="text-gray-500">Birth: </span>
                          <span className="text-gray-700">{member.birthDate}</span>
                        </div>
                      )}
                      {member.birthPlace && (
                        <div>
                          <span className="text-gray-500">Place: </span>
                          <span className="text-gray-700">{member.birthPlace}</span>
                        </div>
                      )}
                      {member.deathDate && (
                        <div>
                          <span className="text-gray-500">Death: </span>
                          <span className="text-gray-700">{member.deathDate}</span>
                        </div>
                      )}
                      {member.deathPlace && (
                        <div>
                          <span className="text-gray-500">Place: </span>
                          <span className="text-gray-700">{member.deathPlace}</span>
                        </div>
                      )}
                    </div>
                    
                    {member.notes && (
                      <p className="text-sm text-gray-600 mt-2 border-t border-gray-100 pt-2">
                        {member.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {pendingMembers.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-gray-900">Pending Validation</h3>
                </div>
                
                <div className="space-y-4">
                  {pendingMembers.map(member => (
                    <div 
                      key={member.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-blue-600">{member.relationship}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-xs text-gray-500">Confidence:</span>
                            <span className={`text-xs font-medium ${getConfidenceColor(member.confidence)}`}>
                              {getConfidenceLabel(member.confidence)} ({Math.round(member.confidence * 100)}%)
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => addToFamilyTree(member)}
                            className="p-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => rejectFamilyMember(member.id)}
                            className="p-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {member.birthDate && (
                          <div>
                            <span className="text-gray-500">Birth: </span>
                            <span className="text-gray-700">{member.birthDate}</span>
                          </div>
                        )}
                        {member.birthPlace && (
                          <div>
                            <span className="text-gray-500">Place: </span>
                            <span className="text-gray-700">{member.birthPlace}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isProcessing}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
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
                ? 'Listening... Tell me about your family history' 
                : isProcessing 
                  ? 'Processing your family history...' 
                  : 'Tap to speak about your family history'}
            </p>
            
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md w-full"
              >
                <p className="text-blue-800">{transcript}</p>
              </motion.div>
            )}
            
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Response</h4>
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
                <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
              </motion.div>
            )}
            
            {pendingMembers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-900">Family Members Detected</h4>
                  </div>
                  <span className="text-sm text-yellow-700">{pendingMembers.length} found</span>
                </div>
                
                <div className="space-y-3">
                  {pendingMembers.slice(0, 2).map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-yellow-200">
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.relationship}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => addToFamilyTree(member)}
                          className="p-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rejectFamilyMember(member.id)}
                          className="p-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {pendingMembers.length > 2 && (
                    <button
                      onClick={() => setShowFamilyTree(true)}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      View all {pendingMembers.length} pending members
                    </button>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <button
                    onClick={() => setShowFamilyTree(true)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <FileTree className="w-4 h-4" />
                    <span>Review & Validate</span>
                  </button>
                </div>
              </motion.div>
            )}
            
            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={() => setShowFamilyTree(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FileTree className="w-5 h-5" />
                <span>View Family Tree</span>
              </button>
            </div>
          </div>
        )}

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
                        speakResponse("This is a test of the voice settings you've selected for your family history assistant.");
                        toast.success('Testing voice settings');
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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