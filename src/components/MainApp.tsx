import React, { useState } from 'react';
import { useSession } from '../lib/session-context';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ErrorBoundary } from '../lib/error-boundary';
import GenesisHome from './GenesisHome';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import EliteHackathonApp from './EliteHackathonApp';
import GlobalIntelligenceDashboard from './GlobalIntelligenceDashboard';
import { GlobalDataProvider } from '../lib/GlobalDataContext';
import PricingPage from './PricingPage';
import AccountBar from './AccountBar';

// A shared demo login is only offered when a demo account is explicitly configured at build time.
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

const SimpleAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Handle specific case where user already exists
        if (error.message === 'User already registered') {
          toast.error('This email is already registered. Please sign in instead or use a different email.');
          setAuthMode('signin'); // Switch to sign in mode
          return;
        }
        throw error;
      }
      toast.success('Account created! Please check your email to verify.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      // More specific error handling
      if (error.message === 'User already registered') {
        toast.error('This email is already registered. Please sign in instead.');
        setAuthMode('signin');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL!,
        password: DEMO_PASSWORD!,
      });

      if (error) throw error;
      toast.success('Demo login successful!');
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error('Demo login failed. Please try manual signup.');
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
          <p className="text-gray-600">
            {authMode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full mb-6 flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="auth-email"
              name="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (authMode === 'signin' ? 'Signing in...' : 'Creating account...') : 
             (authMode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Demo Login Button */}
        {DEMO_EMAIL && DEMO_PASSWORD && <div className="mt-6 text-center">
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
          >
            Try Demo Account
          </button>
        </div>}

        {/* Toggle Auth Mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            {authMode === 'signin' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};


const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center" role="status" aria-live="polite">
    <div className="text-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
      </motion.div>
      <p className="text-gray-600 font-medium">Loading Genesis Heritage Pro...</p>
    </div>
  </div>
);

export const MainApp: React.FC = () => {
  const { session, loading } = useSession();

  if (loading) return <LoadingScreen />;
  if (!session) return <SimpleAuth />;

  return (
    <GlobalDataProvider>
      <ErrorBoundary>
        <Router>
          <AccountBar />
          <Routes>
            <Route path="/" element={<GenesisHome />} />
            <Route path="/dashboard" element={<Dashboard onViewModeChange={() => {}} />} />
            <Route path="/hackathon" element={<EliteHackathonApp />} />
            <Route path="/intelligence" element={<GlobalIntelligenceDashboard />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </GlobalDataProvider>
  );
};
