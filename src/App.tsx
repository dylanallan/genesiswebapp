import React from 'react';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Genesis Heritage</h1>
          <p className="text-gray-600 mt-2">Automate your business and unlock your roots</p>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h2 className="font-medium text-blue-900 mb-2">Business Automation</h2>
            <p className="text-blue-700 text-sm">Streamline your operations with AI-powered automation</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h2 className="font-medium text-purple-900 mb-2">Cultural Heritage</h2>
            <p className="text-purple-700 text-sm">Preserve and explore your cultural roots and traditions</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h2 className="font-medium text-green-900 mb-2">AI-Powered Insights</h2>
            <p className="text-green-700 text-sm">Gain valuable insights with advanced AI technology</p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            Get Started
          </button>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;