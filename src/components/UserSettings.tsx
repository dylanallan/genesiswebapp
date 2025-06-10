import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Globe, 
  Briefcase, 
  Save, 
  X, 
  ChevronRight,
  Bell,
  Shield,
  Palette,
  LogOut,
  Clock,
  Languages,
  MapPin,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAtom } from 'jotai';
import { userPreferencesAtom } from '../lib/store';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useAtom(userPreferencesAtom);
  const [formData, setFormData] = useState({
    name: '',
    ancestry: '',
    businessGoals: '',
    location: '',
    language: '',
    timezone: '',
    culturalBackground: '',
    familyTraditions: '',
    businessType: '',
    industryFocus: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user data
      const { data: userData, error: userDataError } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (userDataError && userDataError.code !== 'PGRST116') {
        throw userDataError;
      }
      
      const profileData = userData?.preferences || {};
      
      setProfile({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_login: userData?.last_login || new Date().toISOString(),
        login_count: userData?.login_count || 1,
        ...profileData
      });
      
      setFormData({
        name: profileData.name || '',
        ancestry: profileData.ancestry || 'European and Asian heritage',
        businessGoals: profileData.businessGoals || 'Automate marketing and preserve cultural knowledge',
        location: profileData.location || '',
        language: profileData.language || 'English',
        timezone: profileData.timezone || 'America/New_York',
        culturalBackground: profileData.culturalBackground || '',
        familyTraditions: profileData.familyTraditions || '',
        businessType: profileData.businessType || '',
        industryFocus: profileData.industryFocus || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update user data
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          preferences: {
            ...profile?.preferences,
            ...formData
          }
        });
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      loadUserProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    setPreferences({
      ...preferences,
      theme: newTheme
    });
    toast.success(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex"
      >
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'profile' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setActiveTab('cultural')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'cultural' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Cultural Heritage</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setActiveTab('business')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'business' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Business</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'appearance' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Appearance</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'notifications' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'security' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'history' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span>Activity History</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
          
          <div className="mt-auto pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'profile' && 'Profile Settings'}
              {activeTab === 'cultural' && 'Cultural Heritage'}
              {activeTab === 'business' && 'Business Settings'}
              {activeTab === 'appearance' && 'Appearance'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'security' && 'Security Settings'}
              {activeTab === 'history' && 'Activity History'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                        {profile?.email}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Language
                        </label>
                        <div className="relative">
                          <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <select
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Japanese">Japanese</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Timezone
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="Europe/London">London (GMT)</option>
                          <option value="Europe/Paris">Central European Time (CET)</option>
                          <option value="Asia/Tokyo">Japan (JST)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>Member since: {formatDate(profile?.created_at)}</div>
                        <div>Last login: {formatDate(profile?.last_login)}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Cultural Heritage Tab */}
                {activeTab === 'cultural' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Ancestry
                      </label>
                      <textarea
                        value={formData.ancestry}
                        onChange={(e) => setFormData({ ...formData, ancestry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Describe your ancestry and heritage"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Cultural Background
                      </label>
                      <textarea
                        value={formData.culturalBackground}
                        onChange={(e) => setFormData({ ...formData, culturalBackground: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Describe your cultural background and influences"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Family Traditions
                      </label>
                      <textarea
                        value={formData.familyTraditions}
                        onChange={(e) => setFormData({ ...formData, familyTraditions: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Describe important family traditions"
                      />
                    </div>
                  </div>
                )}
                
                {/* Business Tab */}
                {activeTab === 'business' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Business Goals
                      </label>
                      <textarea
                        value={formData.businessGoals}
                        onChange={(e) => setFormData({ ...formData, businessGoals: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Describe your business goals and objectives"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Business Type
                        </label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
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
                          Industry Focus
                        </label>
                        <select
                          value={formData.industryFocus}
                          onChange={(e) => setFormData({ ...formData, industryFocus: e.target.value })}
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
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Theme</h4>
                          <p className="text-sm text-gray-500">Customize the appearance of the application</p>
                        </div>
                      </div>
                      <button
                        onClick={handleThemeToggle}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {preferences.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Light Theme</h5>
                          <p className="text-sm text-gray-500">Clean, bright interface</p>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4 flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Dark Theme</h5>
                          <p className="text-sm text-gray-500">Reduced eye strain</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-900">Email Notifications</span>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0" 
                          id="email-toggle"
                          defaultChecked
                        />
                        <label 
                          htmlFor="email-toggle"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:bg-blue-500 peer-checked:before:translate-x-6"
                        ></label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-900">In-App Notifications</span>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0" 
                          id="app-toggle"
                          defaultChecked
                        />
                        <label 
                          htmlFor="app-toggle"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:bg-blue-500 peer-checked:before:translate-x-6"
                        ></label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-gray-700" />
                        <span className="font-medium text-gray-900">Marketing Updates</span>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0" 
                          id="marketing-toggle"
                        />
                        <label 
                          htmlFor="marketing-toggle"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:bg-blue-500 peer-checked:before:translate-x-6"
                        ></label>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Notification Frequency</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="freq-realtime" name="frequency" defaultChecked />
                          <label htmlFor="freq-realtime" className="text-gray-700">Real-time</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="freq-daily" name="frequency" />
                          <label htmlFor="freq-daily" className="text-gray-700">Daily digest</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="freq-weekly" name="frequency" />
                          <label htmlFor="freq-weekly" className="text-gray-700">Weekly summary</label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Shield className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-blue-900">Account Security</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Your account is protected with email and password authentication.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Password</h4>
                      <button
                        onClick={() => toast.info('Password reset email sent')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Reset Password
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                      <button
                        onClick={() => toast.info('Two-factor authentication coming soon')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Enable 2FA
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Sessions</h4>
                      <button
                        onClick={() => toast.success('All other sessions signed out')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Sign Out All Other Sessions
                      </button>
                    </div>
                  </div>
                )}
                
                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-sm">
                            <span className="text-gray-500">Today, 10:23 AM</span>
                            <p className="text-gray-700">Profile updated</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="text-sm">
                            <span className="text-gray-500">Yesterday, 3:45 PM</span>
                            <p className="text-gray-700">Logged in from new device</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div className="text-sm">
                            <span className="text-gray-500">May 15, 2025</span>
                            <p className="text-gray-700">Added new cultural artifact</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Login History</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Today, 10:23 AM</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Chrome on Windows</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yesterday, 3:45 PM</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Safari on iPhone</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};