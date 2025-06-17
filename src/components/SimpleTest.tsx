import React from 'react';

export const SimpleTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          ✅ Genesis Heritage Test
        </h1>
        <p className="text-gray-700">
          If you can see this, React is working properly!
        </p>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-green-800">
            <strong>Status:</strong> All systems operational
          </p>
        </div>
      </div>
    </div>
  );
}; 