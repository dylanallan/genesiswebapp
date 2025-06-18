import { supabase } from './supabase';
import { toast } from 'sonner';

export type SettingsCategory = 
  | 'app_config'
  | 'ai_config' 
  | 'user_preferences'
  | 'system_config'
  | 'security'
  | 'notifications'
  | 'appearance'
  | 'data_sources'
  | 'integrations'
  | 'analytics';

export type SettingsDataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'json'
  | 'array'
  | 'object';

export interface Setting {
  key: string;
  value: string | null;
  data_type: SettingsDataType;
  category: SettingsCategory;
  description: string | null;
  is_public: boolean;
  is_encrypted: boolean;
  is_required: boolean;
  default_value: string | null;
}

export interface UserSetting {
  key: string;
  value: string | null;
  data_type: SettingsDataType;
  category: SettingsCategory;
  description: string | null;
}

export interface SettingsHistory {
  id: string;
  setting_id: string;
  setting_type: 'app' | 'user';
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}

class SettingsManager {
  private cache: Map<string, any> = new Map();
  private userCache: Map<string, any> = new Map();

  /**
   * Get a setting value with fallback to app setting
   */
  async getSetting(key: string, userId?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_setting', {
        setting_key: key,
        user_id_param: userId || null
      });

      if (error) {
        console.error('Error getting setting:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  /**
   * Set a setting value
   */
  async setSetting(
    key: string,
    value: string,
    category: SettingsCategory = 'app_config',
    dataType: SettingsDataType = 'string',
    userId?: string,
    description?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('set_setting', {
        setting_key: key,
        setting_value: value,
        setting_category: category,
        setting_data_type: dataType,
        user_id_param: userId || null,
        description_param: description || null
      });

      if (error) {
        console.error('Error setting setting:', error);
        toast.error('Failed to save setting');
        return null;
      }

      // Clear cache for this key
      this.cache.delete(key);
      if (userId) {
        this.userCache.delete(`${userId}:${key}`);
      }

      toast.success('Setting saved successfully');
      return data;
    } catch (error) {
      console.error('Error setting setting:', error);
      toast.error('Failed to save setting');
      return null;
    }
  }

  /**
   * Get all settings for a category
   */
  async getSettingsByCategory(
    category: SettingsCategory,
    userId?: string
  ): Promise<Setting[]> {
    try {
      const { data, error } = await supabase.rpc('get_settings_by_category', {
        category_param: category,
        user_id_param: userId || null
      });

      if (error) {
        console.error('Error getting settings by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting settings by category:', error);
      return [];
    }
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string, userId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('delete_setting', {
        setting_key: key,
        user_id_param: userId || null
      });

      if (error) {
        console.error('Error deleting setting:', error);
        toast.error('Failed to delete setting');
        return false;
      }

      // Clear cache for this key
      this.cache.delete(key);
      if (userId) {
        this.userCache.delete(`${userId}:${key}`);
      }

      toast.success('Setting deleted successfully');
      return data;
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Failed to delete setting');
      return false;
    }
  }

  /**
   * Get settings history
   */
  async getSettingsHistory(limit: number = 50): Promise<SettingsHistory[]> {
    try {
      const { data, error } = await supabase
        .from('settings_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting settings history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting settings history:', error);
      return [];
    }
  }

  /**
   * Get all app settings
   */
  async getAllAppSettings(): Promise<Setting[]> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category, key');

      if (error) {
        console.error('Error getting all app settings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all app settings:', error);
      return [];
    }
  }

  /**
   * Get all user settings
   */
  async getAllUserSettings(userId: string): Promise<UserSetting[]> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .order('category, key');

      if (error) {
        console.error('Error getting all user settings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all user settings:', error);
      return [];
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(
    settings: Array<{
      key: string;
      value: string;
      category?: SettingsCategory;
      dataType?: SettingsDataType;
      description?: string;
    }>,
    userId?: string
  ): Promise<boolean> {
    try {
      const promises = settings.map(setting =>
        this.setSetting(
          setting.key,
          setting.value,
          setting.category,
          setting.dataType,
          userId,
          setting.description
        )
      );

      await Promise.all(promises);
      toast.success('Settings updated successfully');
      return true;
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      toast.error('Failed to update settings');
      return false;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettingsToDefaults(category?: SettingsCategory, userId?: string): Promise<boolean> {
    try {
      const settings = await this.getSettingsByCategory(category || 'app_config', userId);
      const defaultSettings = settings.filter(s => s.default_value !== null);

      const promises = defaultSettings.map(setting =>
        this.setSetting(
          setting.key,
          setting.default_value!,
          setting.category,
          setting.data_type,
          userId,
          setting.description
        )
      );

      await Promise.all(promises);
      toast.success('Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
      return false;
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(userId?: string): Promise<string> {
    try {
      const appSettings = await this.getAllAppSettings();
      const userSettings = userId ? await this.getAllUserSettings(userId) : [];

      const exportData = {
        app_settings: appSettings,
        user_settings: userSettings,
        export_date: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from JSON
   */
  async importSettings(jsonData: string, userId?: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.app_settings) {
        for (const setting of data.app_settings) {
          await this.setSetting(
            setting.key,
            setting.value || '',
            setting.category,
            setting.data_type,
            undefined, // App settings don't have user_id
            setting.description
          );
        }
      }

      if (data.user_settings && userId) {
        for (const setting of data.user_settings) {
          await this.setSetting(
            setting.key,
            setting.value || '',
            setting.category,
            setting.data_type,
            userId,
            setting.description
          );
        }
      }

      toast.success('Settings imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      toast.error('Failed to import settings');
      return false;
    }
  }

  /**
   * Get cached setting (for performance)
   */
  getCachedSetting(key: string, userId?: string): any {
    const cacheKey = userId ? `${userId}:${key}` : key;
    return this.userCache.get(cacheKey) || this.cache.get(key);
  }

  /**
   * Set cached setting
   */
  setCachedSetting(key: string, value: any, userId?: string): void {
    const cacheKey = userId ? `${userId}:${key}` : key;
    if (userId) {
      this.userCache.set(cacheKey, value);
    } else {
      this.cache.set(key, value);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.userCache.clear();
  }

  /**
   * Validate setting value based on data type
   */
  validateSettingValue(value: string, dataType: SettingsDataType): boolean {
    try {
      switch (dataType) {
        case 'string':
          return typeof value === 'string';
        case 'number':
          return !isNaN(Number(value));
        case 'boolean':
          return value === 'true' || value === 'false';
        case 'json':
          JSON.parse(value);
          return true;
        case 'array':
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        case 'object':
          const parsedObj = JSON.parse(value);
          return typeof parsedObj === 'object' && !Array.isArray(parsedObj);
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get setting with proper type conversion
   */
  async getTypedSetting<T>(
    key: string,
    dataType: SettingsDataType,
    userId?: string
  ): Promise<T | null> {
    const value = await this.getSetting(key, userId);
    if (value === null) return null;

    try {
      switch (dataType) {
        case 'string':
          return value as T;
        case 'number':
          return Number(value) as T;
        case 'boolean':
          return (value === 'true') as T;
        case 'json':
        case 'array':
        case 'object':
          return JSON.parse(value) as T;
        default:
          return value as T;
      }
    } catch {
      return null;
    }
  }
}

// Create singleton instance
export const settingsManager = new SettingsManager();

// Export convenience functions
export const getSetting = (key: string, userId?: string) => settingsManager.getSetting(key, userId);
export const setSetting = (
  key: string,
  value: string,
  category?: SettingsCategory,
  dataType?: SettingsDataType,
  userId?: string,
  description?: string
) => settingsManager.setSetting(key, value, category, dataType, userId, description);
export const getSettingsByCategory = (category: SettingsCategory, userId?: string) => 
  settingsManager.getSettingsByCategory(category, userId);
export const deleteSetting = (key: string, userId?: string) => settingsManager.deleteSetting(key, userId);
export const getAllAppSettings = () => settingsManager.getAllAppSettings();
export const getAllUserSettings = (userId: string) => settingsManager.getAllUserSettings(userId);
export const bulkUpdateSettings = (settings: any[], userId?: string) => 
  settingsManager.bulkUpdateSettings(settings, userId);
export const resetSettingsToDefaults = (category?: SettingsCategory, userId?: string) => 
  settingsManager.resetSettingsToDefaults(category, userId);
export const exportSettings = (userId?: string) => settingsManager.exportSettings(userId);
export const importSettings = (jsonData: string, userId?: string) => 
  settingsManager.importSettings(jsonData, userId); 