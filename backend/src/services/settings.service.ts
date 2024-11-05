import { Settings } from '../models/settings.model';
import MetricsService from './metrics.service';
import setup from './setup';

class SettingsService {
  public baseUrl = process.env.BASE_URL || 'http://localhost';


  async initializeSettings() {
    try {
      this.baseUrl = await this.getSettingsByName('baseUrl');
    } catch (error) {
      this.updateSetting('baseUrl', this.baseUrl);
    }
  }

  async getAllSettings() {
    return await Settings.findAll();
  }

  async getSettingsByName(name: string): Promise<string> {
    const rsp = await Settings.findOne({ where: { name } });
    if (!rsp) {
      throw new Error('Settings not found');
    }
    return rsp.dataValues.value;
  }

  async updateSetting(name: string, value: string) {
    switch (name) {
      case 'webhookProxyUrl':
        setup.addToEnv({ WEBHOOK_PROXY_URL: value });
        break;
      case 'webhookSecret':
        setup.addToEnv({ GITHUB_WEBHOOK_SECRET: value });
        break;
      case 'metricsCronExpression':
        MetricsService.getInstance().updateCronJob(value);
        break;
    }
    try {
      await Settings.upsert({ name, value });
      return await Settings.findOne({ where: { name } });
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  async updateSettings(obj: { [key: string]: string }) {
    await Promise.all(Object.entries(obj).map(([name, value]) => this.updateSetting(name, value)));
  }

  async deleteSettings(name: string) {
    const deleted = await Settings.destroy({
      where: { name }
    });
    if (deleted) {
      return 'Settings deleted';
    }
    throw new Error('Settings not found');
  }
  
}

export default new SettingsService();