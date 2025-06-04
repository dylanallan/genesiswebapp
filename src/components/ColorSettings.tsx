import React from 'react';
import { useAtom } from 'jotai';
import { userPreferencesAtom, defaultColorSchemes, type ColorScheme } from '../lib/cache';
import { Settings, Sun, Moon, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const ColorSettings: React.FC = () => {
  const [preferences, setPreferences] = useAtom(userPreferencesAtom);

  const handleThemeToggle = () => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    setPreferences({
      ...preferences,
      theme: newTheme,
      colorScheme: defaultColorSchemes[newTheme]
    });
    toast.success(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`);
  };

  const handleColorChange = (key: keyof ColorScheme, value: string) => {
    setPreferences({
      ...preferences,
      colorScheme: {
        ...preferences.colorScheme,
        [key]: value
      }
    });
  };

  const resetColors = () => {
    setPreferences({
      ...preferences,
      colorScheme: defaultColorSchemes[preferences.theme]
    });
    toast.success('Color settings reset to default');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-100">Color Settings</h2>
        </div>
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          {preferences.theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-300" />
          )}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(preferences.colorScheme).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <Palette className="w-4 h-4" />
              <span className="capitalize">{key}</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={value}
                onChange={(e) => handleColorChange(key as keyof ColorScheme, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleColorChange(key as keyof ColorScheme, e.target.value)}
                className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm"
                placeholder={`Enter ${key} color`}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={resetColors}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={() => toast.success('Settings saved')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
};