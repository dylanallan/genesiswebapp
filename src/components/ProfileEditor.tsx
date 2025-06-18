import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  ancestry: z.string().optional(),
  businessGoals: z.string().optional(),
  location: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  culturalBackground: z.string().optional(),
  familyTraditions: z.string().optional(),
  businessType: z.string().optional(),
  industryFocus: z.string().optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  isOpen,
  onClose,
  onProfileUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Record<string, any>>({});
  const [updateReason, setUpdateReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<ProfileFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: currentProfile
  });

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_profile');
      
      if (error) throw error;
      
      // Extract profile data from preferences
      const profile: Record<string, any> = {
        ...(data.preferences || {})
      };
      
      setCurrentProfile(profile);
      reset(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    // Only include fields that have changed
    const updates: Record<string, string> = {};
    
    Object.keys(data).forEach(key => {
      const typedKey = key as keyof ProfileFormData;
      if (data[typedKey] !== currentProfile[key]) {
        if (data[typedKey]) {
          updates[key] = data[typedKey] as string;
        }
      }
    });
    
    if (Object.keys(updates).length === 0) {
      toast.info('No changes to save');
      return;
    }
    
    // Store updates for later and show reason modal
    setPendingUpdates(updates);
    setShowReasonModal(true);
  };

  const confirmUpdate = async () => {
    if (!pendingUpdates) return;
    
    setIsLoading(true);
    try {
      // Call the Edge Function to update profile
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('No active session');
      }
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: pendingUpdates,
          reason: updateReason || 'Profile update'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      toast.success('Profile updated successfully');
      onProfileUpdate();
      onClose();
      
      // Reset form and state
      setUpdateReason('');
      setPendingUpdates(null);
      setShowReasonModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset(currentProfile);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Profile Information"
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-genesis-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Your full name"
              />
              
              <Input
                label="Location"
                {...register('location')}
                error={errors.location?.message}
                placeholder="City, Country"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Language"
                {...register('language')}
                error={errors.language?.message}
                placeholder="Preferred language"
              />
              
              <Input
                label="Timezone"
                {...register('timezone')}
                error={errors.timezone?.message}
                placeholder="e.g., UTC-5, Europe/London"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Ancestry
              </label>
              <textarea
                {...register('ancestry')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Describe your ancestry and heritage"
              />
              {errors.ancestry && (
                <p className="text-sm text-red-600">{errors.ancestry.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Cultural Background
              </label>
              <textarea
                {...register('culturalBackground')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Describe your cultural background and influences"
              />
              {errors.culturalBackground && (
                <p className="text-sm text-red-600">{errors.culturalBackground.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Family Traditions
              </label>
              <textarea
                {...register('familyTraditions')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Describe important family traditions"
              />
              {errors.familyTraditions && (
                <p className="text-sm text-red-600">{errors.familyTraditions.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <select
                  {...register('businessType')}
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
                {errors.businessType && (
                  <p className="text-sm text-red-600">{errors.businessType.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Industry Focus
                </label>
                <select
                  {...register('industryFocus')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="finance">Finance</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="arts">Arts & Culture</option>
                  <option value="nonprofit">Nonprofit</option>
                  <option value="other">Other</option>
                </select>
                {errors.industryFocus && (
                  <p className="text-sm text-red-600">{errors.industryFocus.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Business Goals
              </label>
              <textarea
                {...register('businessGoals')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe your business goals and objectives"
              />
              {errors.businessGoals && (
                <p className="text-sm text-red-600">{errors.businessGoals.message}</p>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                leftIcon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!isDirty || isLoading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
      
      {/* Reason Modal */}
      <Modal
        isOpen={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        title="Why are you updating this information?"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <InfoIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-blue-800">
                  We keep a history of profile changes to help maintain the accuracy of your cultural and business information.
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  Please provide a brief reason for this update.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Reason for Update
            </label>
            <textarea
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="e.g., Discovered new ancestry information, Changed business focus, Relocated to new area"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowReasonModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmUpdate}
              className="flex-1"
              isLoading={isLoading}
            >
              Confirm Update
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Info icon component
const InfoIcon = ({ className }: { className?: string }) => (
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
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);