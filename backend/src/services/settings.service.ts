import mongoose from 'mongoose';
import app from '../index.js';
import logger from './logger.js';

export interface SettingsType {
  baseUrl?: string,
  webhookProxyUrl?: string,
  webhookSecret?: string,
  metricsCronExpression: string,
  devCostPerYear: string,
  developerCount: string,
  hoursPerYear: string,
  percentTimeSaved: string,
  percentCoding: string,
}

class SettingsService {
  settings: SettingsType;

  constructor(
    private defaultSettings: SettingsType
  ) {
    this.settings = defaultSettings;
  }

  async initialize() {
    for (const [name, value] of Object.entries(this.defaultSettings)) {
      try {
        const setting = await this.getSettingsByName(name);
        if (setting) {
          this.settings[name as keyof SettingsType] = setting
        }
      } catch {
        if (value) {
          await this.updateSetting(name as keyof SettingsType, value);
        }
      }
    }
    return this.settings;
  }

  async getAllSettings() {
    try {
      const Setting = mongoose.model('Settings');
      const settingsArray = await Setting.find<{
        name: string;
        value: string;
      }>({});
      return settingsArray.reduce((acc, setting) => {
        acc[setting.name] = setting.value;
        return acc;
      }, {} as any);
    } catch (error) {
      console.error('Failed to get all settings:', error);
      throw error;
    }
  }

  async getSettingsByName(name: string): Promise<string | undefined> {
    try {
      const setting = await mongoose.model('Settings').findOne({ name });
      if (!setting) {
        return undefined;
      }
      return setting.value;
    } catch (error) {
      console.error('Failed to get setting by name:', error);
      return undefined;
    }
  }

  async updateSetting(name: keyof SettingsType, value: string) {
    try {
      const Setting = mongoose.model('Settings');

      const existingSetting = await Setting.findOne({ name });
      const changed = !existingSetting || existingSetting.value !== value;
      if (changed) {
        logger.info(`Setting ${name} changed to ${value}`);
        const setting = await Setting.findOneAndUpdate(
          { name },
          { value },
          {
            new: true,
            upsert: true,
          }
        );

        switch (setting.name) {
          case 'metricsCronExpression':
            app.github.queryService?.updateCronJob(setting.value);
            break;
          case 'webhookSecret':
            app.github.connect({
              webhooks: {
                secret: setting.value
              }
            });
            break;
          case 'webhookProxyUrl':
            app.github.smee.connect({
              url: setting.value
            });
            break;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }

  async updateSettings(obj: { [key: string]: string }) {
    await Promise.all(
      Object.entries(obj).map(([name, value]) =>
        this.updateSetting(name as keyof SettingsType, value)
      )
    );
  }

  async deleteSettings(name: string) {
    try {
      const Setting = mongoose.model('Settings');
      await Setting.findOneAndDelete({ name });
      // if (!result) {
      //   throw new Error('Settings not found');
      // }
    } catch (error) {
      console.error('Failed to delete setting:', error);
      throw error;
    }
  }
}

export default SettingsService;