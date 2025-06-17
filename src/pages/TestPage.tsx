import React, { useState } from 'react';
import { chatApi } from '../api/chat';
import { toast } from 'sonner';

export const TestPage: React.FC = () => {
  const [testMessage, setTestMessage] = useState('Hello! Can you help me with genealogy research?');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Starting chat test...');
      const response = await chatApi.sendMessage(testMessage);
      console.log('✅ Test completed:', response);
      setResult(response);
      toast.success('Chat API test successful!');
    } catch (error) {
      console.error('❌ Test failed:', error);
      setResult({ error: error.message });
      toast.error('Chat API test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chat API Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Test Message:</label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full p-3 border rounded-lg"
              rows={3}
            />
          </div>
          
          <button
            onClick={runTest}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
          >
            {loading ? 'Testing...' : 'Run Chat API Test'}
          </button>
          
          {result && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              {result.error ? (
                <div className="text-red-600">{result.error}</div>
              ) : (
                <div className="space-y-2">
                  <p><strong>Provider:</strong> {result.provider}</p>
                  <p><strong>Model:</strong> {result.model}</p>
                  <p><strong>Response:</strong></p>
                  <div className="p-3 bg-gray-100 rounded">
                    {result.response}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 