import React, { useState, useEffect } from 'react';
import { useSession } from '../lib/session-context';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ErrorBoundary } from '../lib/error-boundary';

// Simple working components
const SimpleDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Genesis Heritage Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your AI-powered genealogy and cultural heritage platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Chat Assistant</h3>
            <p className="text-gray-600 mb-4">
              Get help with genealogy research, cultural heritage questions, and more.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Universal Search</h3>
            <p className="text-gray-600 mb-4">
              Search across genealogy databases, cultural archives, and family records.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Search Now
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Sources</h3>
            <p className="text-gray-600 mb-4">
              Manage your data sources and integrations for comprehensive research.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Manage Sources
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-green-100 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              ✅ System Status: All systems operational
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Genesis Heritage</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setEmail('demo@genesisheritage.com');
              setPassword('password123');
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Use Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export const MainApp: React.FC = () => {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 font-medium">Loading Genesis Heritage Pro...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <SimpleAuth />;
  }

  return (
    <ErrorBoundary>
      <SimpleDashboard />
    </ErrorBoundary>
  );
};