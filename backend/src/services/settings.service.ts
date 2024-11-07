<<<<<<< HEAD
import { Settings } from '../models/settings.model';
import QueryService from './query.service';
import setup from './setup';
=======
import { Settings } from '../models/settings.model.js';
import MetricsService from './metrics.service.js';
import setup from './setup.js';
>>>>>>> 518279f0bc3ac0923b7498bd46ecf4fa4794e860

class SettingsService {
  public baseUrl = process.env.BASE_URL || 'http://localhost';

  constructor() {
  }

  async initializeSettings() {
    try {
      this.baseUrl = await this.getSettingsByName('baseUrl')
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
    if (name === 'webhookProxyUrl') setup.addToEnv({ WEBHOOK_PROXY_URL: value });
    if (name === 'webhookSecret') setup.addToEnv({ GITHUB_WEBHOOK_SECRET: value });
    if (name === 'metricsCronExpression') QueryService.getInstance().updateCronJob(value);
    try {
      await Settings.upsert({ name, value });
      return await Settings.findOne({ where: { name } });
    } catch (error) {
      throw error;
    }
  }

  async updateSettings(obj: { [key: string]: string }) {
    Object.entries(obj).forEach(([name, value]) => {
      this.updateSetting(name, value);
    });
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