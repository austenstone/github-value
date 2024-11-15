import { Settings } from '../models/settings.model';
import { QueryService } from './query.service';
import setup from './setup';
import SmeeService from './smee';

class SettingsService {
  public baseUrl = process.env.BASE_URL || 'http://localhost';

  constructor() {
  }

  async initializeSettings() {
    try {
      this.baseUrl = await this.getSettingsByName('baseUrl')
    } catch {
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
    await Settings.upsert({ name, value });
    if (name === 'webhookProxyUrl') {
      if (value !== await this.getSettingsByName('webhookProxyUrl')) {
        setup.addToEnv({ WEBHOOK_PROXY_URL: value });
        await SmeeService.createSmeeWebhookProxy();
      }
    }
    if (name === 'webhookSecret') {
      setup.addToEnv({ GITHUB_WEBHOOK_SECRET: value });
      await setup.createAppFromEnv();
    }
    if (name === 'metricsCronExpression') QueryService.getInstance().updateCronJob(value);
    return await Settings.findOne({ where: { name } });
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
    if (!deleted) {
      throw new Error('Settings not found');
    }
  }
}

export default new SettingsService();