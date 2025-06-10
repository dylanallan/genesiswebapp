import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, UserPlus, Loader2, Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type AuthForm = z.infer<typeof authSchema>;

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    resetField,
    setValue
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: AuthForm) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;
        
        if (authData?.user) {
          toast.success('Successfully signed in!');
        }
      } else {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: {
              email_confirmed: false
            }
          }
        });

        if (error) throw error;
        
        if (authData?.user && !authData?.user?.identities?.length) {
          toast.success('Please check your email to verify your account');
        } else if (authData?.user) {
          toast.success('Account created successfully!');
        }
        reset();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        setAuthError('Invalid email or password');
        toast.error('Invalid email or password');
        resetField('password');
      } else if (error.message.includes('Email not confirmed')) {
        setAuthError('Please verify your email before signing in');
        toast.error('Please verify your email before signing in');
      } else if (error.message.includes('already registered')) {
        setAuthError('This email is already registered');
        toast.error('This email is already registered');
        setIsLogin(true);
      } else {
        setAuthError(error.message || 'Authentication failed. Please try again.');
        toast.error(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes, pre-fill the form
  const fillDemoCredentials = () => {
    setValue('email', 'demo@genesisheritage.com');
    setValue('password', 'Genesis2025');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center p-4">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.div 
            className="mx-auto h-24 w-24 relative mb-8"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Brain className="w-24 h-24 text-genesis-600" />
          </motion.div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Start your journey with Genesis Heritage'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-genesis-100">
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {authError}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-genesis-500 focus:border-genesis-500 sm:text-sm"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-genesis-500 focus:border-genesis-500 sm:text-sm"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-genesis-600 hover:bg-genesis-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-genesis-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign in
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create account
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setAuthError(null);
              reset();
            }}
            className="text-sm text-genesis-600 hover:text-genesis-500 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Use demo credentials
          </button>
        </div>
      </motion.div>
    </div>
  );
};