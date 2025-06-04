import React from 'react';
import { LMSChat } from './LMSChat';
import { useSession } from '@supabase/auth-helpers-react';

export const Dashboard: React.FC = () => {
  const session = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Welcome to Genesis 2.0</h1>
            <p className="text-gray-600">Your AI-powered learning journey begins here.</p>
          </div>
          <LMSChat />
        </div>
      </div>
    </div>
  );
};