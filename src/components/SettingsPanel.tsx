import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Download, Upload, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Setting {
  key: string;
  value: string | null;
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'object';
  category: string;
  description: string | null;
  is_public: boolean;
  is_encrypted: boolean;
  is_required: boolean;
  default_value: string | null;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('app_config');
  const [showEncrypted, setShowEncrypted] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const categories = [
    { key: 'app_config', label: 'App Configuration', icon: '⚙️' },
    { key: 'ai_config', label: 'AI Configuration', icon: '🤖' },
    { key: 'user_preferences', label: 'User Preferences', icon: '👤' },
    { key: 'appearance', label: 'Appearance', icon: '🎨' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'data_sources', label: 'Data Sources', icon: '📊' },
    { key: 'integrations', label: 'Integrations', icon: '🔗' },
    { key: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, selectedCategory]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_settings_by_category', {
        category_param: selectedCategory,
        user_id_param: null
      });

      if (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
        return;
      }

      setSettings(data || []);
      
      // Initialize edited values with current values
      const initialValues: Record<string, string> = {};
      data?.forEach(setting => {
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

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      const promises = Object.entries(editedValues).map(([key, value]) => 
        saveSetting(key, value)
      );
      await Promise.all(promises);
      toast.success('All settings saved successfully');
    } catch (error) {
      console.error('Error saving all settings:', error);
      toast.error('Failed to save some settings');
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

  const exportSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category, key');

      if (error) {
        console.error('Error exporting settings:', error);
        toast.error('Failed to export settings');
        return;
      }

      const exportData = {
        settings: data,
        export_date: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genesis-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Settings exported successfully');
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.error('Failed to export settings');
    }
  };

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.settings || !Array.isArray(data.settings)) {
        toast.error('Invalid settings file format');
        return;
      }

      setSaving(true);
      const promises = data.settings.map((setting: Setting) =>
        saveSetting(setting.key, setting.value || '')
      );

      await Promise.all(promises);
      toast.success('Settings imported successfully');
      loadSettings(); // Reload to show imported settings
    } catch (error) {
      console.error('Error importing settings:', error);
      toast.error('Failed to import settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleEncrypted = (key: string) => {
    setShowEncrypted(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderSettingInput = (setting: Setting) => {
    const value = editedValues[setting.key] || setting.value || '';
    const isEncrypted = setting.is_encrypted;
    const showValue = isEncrypted ? showEncrypted[setting.key] : true;

    const handleChange = (newValue: string) => {
      setEditedValues(prev => ({
        ...prev,
        [setting.key]: newValue
      }));
    };

    switch (setting.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleChange(e.target.checked ? 'true' : 'false')}
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
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'json':
      case 'array':
      case 'object':
        return (
          <textarea
            value={showValue ? value : '••••••••'}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter JSON..."
          />
        );

      default:
        return (
          <div className="relative">
            <input
              type={showValue ? 'text' : 'password'}
              value={showValue ? value : '••••••••'}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isEncrypted && (
              <button
                type="button"
                onClick={() => toggleEncrypted(setting.key)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        );
    }
  };

  const hasChanges = Object.keys(editedValues).length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                        selectedCategory === category.key
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {categories.find(c => c.key === selectedCategory)?.label}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={exportSettings}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <Download size={16} />
                      <span>Export</span>
                    </button>
                    <label className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">
                      <Upload size={16} />
                      <span>Import</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importSettings}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={resetToDefaults}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <RotateCcw size={16} />
                      <span>Reset</span>
                    </button>
                    {hasChanges && (
                      <button
                        onClick={saveAllChanges}
                        disabled={saving}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        <span>Save All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Settings List */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : settings.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No settings found for this category.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {settings.map((setting) => (
                        <div key={setting.key} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                {setting.key}
                              </h4>
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
                            <div className="flex items-center space-x-2">
                              {editedValues[setting.key] !== setting.value && (
                                <button
                                  onClick={() => saveSetting(setting.key, editedValues[setting.key] || '')}
                                  disabled={saving}
                                  className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
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
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel; 