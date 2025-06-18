import React, { useState } from 'react';
import { chatApi } from '../api/chat';

export const ChatTest: React.FC = () => {
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
    } catch (error) {
      console.error('❌ Test failed:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Chat API Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Message:</label>
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>
      
      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Test'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          {result.error ? (
            <div className="text-red-600">{result.error}</div>
          ) : (
            <div>
              <p><strong>Provider:</strong> {result.provider}</p>
              <p><strong>Model:</strong> {result.model}</p>
              <p><strong>Response:</strong></p>
              <div className="mt-2 p-2 bg-gray-100 rounded">
                {result.response}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 