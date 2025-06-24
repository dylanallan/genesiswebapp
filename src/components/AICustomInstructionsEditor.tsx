import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Save, 
  X, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Info,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface AICustomInstructionsEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICustomInstructionsEditor: React.FC<AICustomInstructionsEditorProps> = ({
  isOpen,
  onClose
}) => {
  const [instructions, setInstructions] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInstructions();
    }
  }, [isOpen]);

  const loadInstructions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_custom_instructions')
        .select('instructions, is_active')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      if (!error && data) {
        setInstructions(data.instructions || '');
        setIsEnabled(data.is_active);
      }
    } catch (error) {
      console.error('Error loading custom instructions:', error);
      toast.error('Failed to load custom instructions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ai_custom_instructions')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          instructions,
          is_active: isEnabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Custom instructions saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving custom instructions:', error);
      toast.error('Failed to save custom instructions');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEnabled = async () => {
    setIsEnabled(!isEnabled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Custom AI Instructions</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleEnabled}
                    className="p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isEnabled ? (
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <span className="font-medium text-gray-900">Enable custom instructions</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Instructions for the AI
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={8}
                  placeholder="Enter your custom instructions for the AI assistant..."
                  disabled={!isEnabled}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-blue-900">Instruction Tips</h3>
                    <ul className="mt-2 space-y-1 text-sm text-blue-700">
                      <li>• Include your role, industry, or background</li>
                      <li>• Specify your preferred response format</li>
                      <li>• Mention topics you're interested in</li>
                      <li>• Note any specific terminology or jargon you use</li>
                      <li>• Include any accessibility needs</li>
                    </ul>
                  </div>
                </div>
              </div>

              {!isEnabled && instructions && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-700">
                        You have custom instructions saved but they are currently disabled. 
                        Enable the checkbox above to use these instructions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Instructions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};