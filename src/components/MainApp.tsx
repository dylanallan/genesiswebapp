import React, { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Dashboard } from './Dashboard';
import { EnterpriseDashboard } from './EnterpriseDashboard';
import { HackathonDashboard } from './HackathonDashboard';
import { Auth } from './Auth';
import { Loader2, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { BackendSetup } from './BackendSetup';
import { checkBackendStatus } from '../lib/backend-status';

export const MainApp: React.FC = () => {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'enterprise' | 'hackathon'>('standard');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          // Check backend status first
          setCheckingBackend(true);
          const backendStatus = await checkBackendStatus();
          setBackendReady(backendStatus.overallStatus === 'operational');
          setCheckingBackend(false);
          
          if (backendStatus.overallStatus !== 'operational') {
            return;
          }
          
          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admin_roles')
            .select('role_name')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (adminData) {
            setUserRole(adminData.role_name);
          } else {
            setUserRole('user');
          }

          // Get user preferences
          const { data: userData } = await supabase
            .from('user_data')
            .select('preferences')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (userData?.preferences?.viewMode) {
            setViewMode(userData.preferences.viewMode);
          }
          
          // Check if profile setup is needed
          const isProfileComplete = userData?.preferences?.ancestry || 
                                   userData?.preferences?.businessGoals;
          
          setShowProfileSetup(!isProfileComplete);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        }
      }
      setIsLoading(false);
    };

    checkUserRole();
  }, [session, backendReady]);

  const handleViewModeChange = async (mode: 'standard' | 'enterprise' | 'hackathon') => {
    setViewMode(mode);
    
    if (session?.user) {
      try {
        await supabase
          .from('user_data')
          .upsert({
            user_id: session.user.id,
            preferences: { viewMode: mode }
          });
      } catch (error) {
        console.error('Error updating view mode preference:', error);
        toast.error('Failed to update view mode');
      }
    }
  };

  const handleBackendSetupComplete = () => {
    setBackendReady(true);
    toast.success('Backend setup complete!');
  };

  if (isLoading || checkingBackend) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-12 h-12 text-genesis-600 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 font-medium">Loading Genesis Heritage Pro...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!backendReady) {
    return <BackendSetup onSetupComplete={handleBackendSetupComplete} />;
  }

  if (showProfileSetup) {
    return <ProfileSetup onComplete={() => setShowProfileSetup(false)} />;
  }

  switch (viewMode) {
    case 'enterprise':
      return <EnterpriseDashboard />;
    case 'hackathon':
      return <HackathonDashboard />;
    default:
      return <Dashboard onViewModeChange={handleViewModeChange} />;
  }
};

// Profile Setup Component
const ProfileSetup: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    ancestry: '',
    businessGoals: '',
    location: '',
    culturalBackground: '',
    businessType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update user profile
      const { error } = await supabase.rpc(
        'update_user_profile_batch',
        {
          p_updates: formData,
          p_reason: 'Initial profile setup'
        }
      );
      
      if (error) throw error;
      
      toast.success('Profile setup complete!');
      onComplete();
    } catch (error) {
      console.error('Error setting up profile:', error);
      toast.error('Failed to set up profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl w-full p-6"
      >
        <div className="text-center mb-6">
          <Brain className="w-12 h-12 text-genesis-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="text-gray-600 mt-2">
            Help us personalize your experience by sharing a bit about yourself
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            {[1, 2, 3].map(i => (
              <React.Fragment key={i}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= i ? 'bg-genesis-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={`h-1 flex-1 ${
                    step > i ? 'bg-genesis-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, Country"
                />
              </div>
              
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
          
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cultural Heritage</h3>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Ancestry
                </label>
                <textarea
                  name="ancestry"
                  value={formData.ancestry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe your ancestry and heritage"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Cultural Background
                </label>
                <textarea
                  name="culturalBackground"
                  value={formData.culturalBackground}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe your cultural background and influences"
                />
              </div>
              
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
          
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select business type</option>
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="nonprofit">Nonprofit</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Business Goals
                </label>
                <textarea
                  name="businessGoals"
                  value={formData.businessGoals}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe your business goals and objectives"
                  required
                />
              </div>
              
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
};