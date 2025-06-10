import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit, History, RefreshCw, Settings, Shield, Calendar, MapPin, Globe, Briefcase, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { ProfileEditor } from './ProfileEditor';
import { ProfileHistoryViewer } from './ProfileHistoryViewer';
import { Button } from './ui/Button';

interface UserProfile {
  user_id: string;
  preferences: Record<string, any>;
  settings: Record<string, any>;
  last_login: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export const UserProfileManager: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showHistoryViewer, setShowHistoryViewer] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_profile');
      
      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    loadUserProfile();
  };

  const getProfileValue = (key: string): string => {
    if (!profile) return '';
    
    // Check in preferences
    if (profile.preferences && profile.preferences[key] !== undefined) {
      return profile.preferences[key];
    }
    
    // Check in settings
    if (profile.settings && profile.settings[key] !== undefined) {
      return profile.settings[key];
    }
    
    return '';
  };

  const getBusinessTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'sole_proprietorship': 'Sole Proprietorship',
      'partnership': 'Partnership',
      'llc': 'LLC',
      'corporation': 'Corporation',
      'nonprofit': 'Nonprofit',
      'freelancer': 'Freelancer',
      'other': 'Other'
    };
    
    return types[type] || type;
  };

  const getIndustryLabel = (industry: string): string => {
    const industries: Record<string, string> = {
      'technology': 'Technology',
      'healthcare': 'Healthcare',
      'education': 'Education',
      'finance': 'Finance',
      'retail': 'Retail',
      'manufacturing': 'Manufacturing',
      'hospitality': 'Hospitality',
      'arts': 'Arts & Culture',
      'nonprofit': 'Nonprofit',
      'other': 'Other'
    };
    
    return industries[industry] || industry;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <User className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowHistoryViewer(true)}
            variant="outline"
            leftIcon={<History className="w-4 h-4" />}
          >
            View History
          </Button>
          <Button
            onClick={() => setShowProfileEditor(true)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : !profile ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-500 mb-4">
            We couldn't find your profile information
          </p>
          <Button
            onClick={() => setShowProfileEditor(true)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Create Profile
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{getProfileValue('name') || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{getProfileValue('location') || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Language</p>
                    <div className="flex items-center space-x-1">
                      <Languages className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{getProfileValue('language') || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Timezone</p>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{getProfileValue('timezone') || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Cultural Heritage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Cultural Heritage</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Ancestry</p>
                  <p className="text-gray-900">{getProfileValue('ancestry') || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Cultural Background</p>
                  <p className="text-gray-900">{getProfileValue('culturalBackground') || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Family Traditions</p>
                  <p className="text-gray-900">{getProfileValue('familyTraditions') || 'Not specified'}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Business Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Business Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Business Type</p>
                    <p className="text-gray-900">
                      {getProfileValue('businessType') 
                        ? getBusinessTypeLabel(getProfileValue('businessType')) 
                        : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="text-gray-900">
                      {getProfileValue('industryFocus') 
                        ? getIndustryLabel(getProfileValue('industryFocus')) 
                        : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Business Goals</p>
                  <p className="text-gray-900">{getProfileValue('businessGoals') || 'Not specified'}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Account Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Account Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="text-gray-900">{formatDate(profile.last_login)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Login Count</p>
                  <p className="text-gray-900">{profile.login_count}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Profile Editor Modal */}
      <ProfileEditor
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {/* Profile History Viewer */}
      {showHistoryViewer && (
        <ProfileHistoryViewer
          isOpen={showHistoryViewer}
          onClose={() => setShowHistoryViewer(false)}
        />
      )}
    </div>
  );
};

// Clock icon component
const Clock = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Format date helper function
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};