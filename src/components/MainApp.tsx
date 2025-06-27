import React, { useState, useEffect } from 'react';
import { useSession } from '../lib/session-context';
import { Brain, Menu, X, Home, Bot, Globe, BarChart3, Settings, Users, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ErrorBoundary } from '../lib/error-boundary';
import GenesisHome from './GenesisHome';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import EliteHackathonApp from './EliteHackathonApp';
import GlobalIntelligenceDashboard from './GlobalIntelligenceDashboard';
import { GlobalDataProvider } from '../lib/GlobalDataContext';
import { AutomationHub } from './AutomationHub';
import { SystemDashboard } from './SystemDashboard';

// Full Dashboard with all features
const FullDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState('main');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'main', label: 'Dashboard', icon: Home, component: EliteHackathonApp },
    { id: 'automation', label: 'Automation Hub', icon: Bot, component: AutomationHub },
    { id: 'system', label: 'System Health', icon: BarChart3, component: SystemDashboard },
    { id: 'cultural', label: 'Cultural AI', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'team', label: 'Team Workspace', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const CurrentComponent = navigationItems.find(item => item.id === currentView)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Genesis Heritage Pro
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Cultural Heritage & Business Automation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 text-sm font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 px-4 py-6">
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {CurrentComponent ? (
            <CurrentComponent />
          ) : (
            <div className="p-8">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {navigationItems.find(item => item.id === currentView)?.label}
                </h2>
                <p className="text-gray-600">
                  This feature is coming soon. Stay tuned for updates!
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

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
        email: 'demo@genesisheritage.com',
        password: 'demo123456',
      });

      if (error) {
        // If demo account doesn't exist, try to create it
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'demo@genesisheritage.com',
          password: 'demo123456',
        });
        
        if (signUpError) throw signUpError;
        toast.success('Demo account created! Please check your email.');
      } else {
        toast.success('Demo login successful!');
      }
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
              minLength={6}
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
        <div className="mt-6 text-center">
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
          >
            Try Demo Account
          </button>
        </div>

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

export const MainApp: React.FC = () => {
  const { session, loading } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  // DEVELOPMENT BYPASS - Force immediate loading for Bolt.new testing
  const DEV_BYPASS = true; // Set to false to restore normal loading

  useEffect(() => {
    if (DEV_BYPASS) {
      // Immediate bypass for development
      setIsLoading(false);
      return;
    }

    // Very aggressive timeout for Bolt.new - 200ms max
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    
    // Force loading to false after 1 second as a safety measure
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      console.warn('[GENESIS]: Forced loading to false after 1s timeout');
    }, 1000);
    
    // Bolt.new specific bypass - if still loading after 500ms, force through
    const boltNewBypass = setTimeout(() => {
      if (loading) {
        console.log('[GENESIS]: Bolt.new bypass - forcing app to load');
        setIsLoading(false);
      }
    }, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      clearTimeout(boltNewBypass);
    };
  }, [loading]);

  // Show loading screen only for a very brief moment
  const shouldShowLoading = !DEV_BYPASS && loading && isLoading;

  if (shouldShowLoading) {
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
          <p className="text-gray-400 text-sm mt-2">Connecting to AI systems...</p>
        </div>
      </div>
    );
  }

  // If session loading failed or timed out, show auth
  if (!session) {
    return <SimpleAuth />;
  }

  return (
    <GlobalDataProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<GenesisHome />} />
            <Route path="/dashboard" element={<Dashboard onViewModeChange={() => {}} />} />
            <Route path="/hackathon" element={<EliteHackathonApp />} />
            <Route path="/intelligence" element={<GlobalIntelligenceDashboard />} />
            {/* Add more routes for other advanced dashboards as needed */}
          </Routes>
        </Router>
      </ErrorBoundary>
    </GlobalDataProvider>
  );
};