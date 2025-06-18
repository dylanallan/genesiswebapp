import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Setting {
  key: string;
  value: string | null;
  data_type: string;
  category: string;
  description: string | null;
  is_public: boolean;
  is_encrypted: boolean;
  is_required: boolean;
  default_value: string | null;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category, key');

      if (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
        return;
      }

      setSettings(data || []);
      
      // Initialize edited values with current values
      const initialValues: Record<string, string> = {};
      data?.forEach((setting: Setting) => {
        initialValues[setting.key] = setting.value || '';
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      setSaving(true);
      const setting = settings.find(s => s.key === key);
      if (!setting) return;

      const { error } = await supabase.rpc('set_setting', {
        setting_key: key,
        setting_value: value,
        setting_category: setting.category,
        setting_data_type: setting.data_type,
        user_id_param: null,
        description_param: setting.description
      });

      if (error) {
        console.error('Error saving setting:', error);
        toast.error('Failed to save setting');
        return;
      }

      toast.success('Setting saved successfully');
      
      // Update local state
      setSettings(prev => prev.map(s => 
        s.key === key ? { ...s, value } : s
      ));
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setSaving(true);
      const defaultSettings = settings.filter(s => s.default_value !== null);
      
      const promises = defaultSettings.map(setting =>
        saveSetting(setting.key, setting.default_value!)
      );
      
      await Promise.all(promises);
      
      // Update edited values
      const newEditedValues: Record<string, string> = {};
      defaultSettings.forEach(setting => {
        newEditedValues[setting.key] = setting.default_value!;
      });
      setEditedValues(newEditedValues);
      
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderSettingInput = (setting: Setting) => {
    const value = editedValues[setting.key] || setting.value || '';

    switch (setting.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleInputChange(setting.key, e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {value === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Genesis Dashboard Settings</h1>
        </div>
        <button
          onClick={resetToDefaults}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RotateCcw size={16} />
          <span>Reset to Defaults</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Settings</h2>
          
          <div className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.key} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {setting.key}
                    </h3>
                    {setting.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {setting.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Type: {setting.data_type}</span>
                      {setting.is_required && (
                        <span className="text-red-500">Required</span>
                      )}
                      {setting.is_public && (
                        <span className="text-green-500">Public</span>
                      )}
                      {setting.is_encrypted && (
                        <span className="text-orange-500">Encrypted</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => saveSetting(setting.key, editedValues[setting.key] || '')}
                    disabled={saving || editedValues[setting.key] === setting.value}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={14} />
                    <span>Save</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {renderSettingInput(setting)}
                  {setting.default_value && (
                    <div className="text-xs text-gray-500">
                      Default: {setting.default_value}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>✅ Settings are automatically saved to the Genesis Dashboard Supabase project.</p>
        <p>Changes will be applied immediately across the application.</p>
      </div>
    </div>
  );
};

export default Settings;
