import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Download, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { streamResponse } from '../lib/ai';

interface ConversationSummarizerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp?: Date;
  }>;
}

export const ConversationSummarizer: React.FC<ConversationSummarizerProps> = ({
  isOpen,
  onClose,
  sessionId,
  messages
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryType, setSummaryType] = useState<'concise' | 'detailed' | 'bullet'>('concise');

  const generateSummary = async () => {
    if (messages.length === 0) {
      toast.error('No messages to summarize');
      return;
    }

    setIsLoading(true);
    setSummary('');

    try {
      // Format conversation for the AI
      const conversation = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      // Create prompt based on summary type
      let prompt = '';
      switch (summaryType) {
        case 'concise':
          prompt = `Summarize this conversation in a concise paragraph (max 3 sentences):\n\n${conversation}`;
          break;
        case 'detailed':
          prompt = `Provide a detailed summary of this conversation, highlighting key points, questions, and conclusions:\n\n${conversation}`;
          break;
        case 'bullet':
          prompt = `Summarize this conversation as a bulleted list of key points and takeaways:\n\n${conversation}`;
          break;
      }

      // Stream the response
      let fullSummary = '';
      for await (const chunk of streamResponse(prompt, 'gpt-4')) {
        fullSummary += chunk;
        setSummary(fullSummary);
      }

      // Store the summary in the database
      try {
        await supabase
          .from('conversation_summaries')
          .upsert({
            session_id: sessionId,
            summary: fullSummary,
            summary_type: summaryType,
            message_count: messages.length,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.warn('Failed to store summary:', dbError);
      }

      toast.success('Summary generated successfully');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
      setSummary('Error generating summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard');
  };

  const downloadSummary = () => {
    const element = document.createElement('a');
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `conversation-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Summary downloaded');
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
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Conversation Summary</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setSummaryType('concise')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                  summaryType === 'concise'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Concise
              </button>
              <button
                onClick={() => setSummaryType('detailed')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                  summaryType === 'detailed'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Detailed
              </button>
              <button
                onClick={() => setSummaryType('bullet')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                  summaryType === 'bullet'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Bullet Points
              </button>
            </div>

            <button
              onClick={generateSummary}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Summary...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>

            {summary && (
              <div className="mt-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    {summary}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={downloadSummary}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};