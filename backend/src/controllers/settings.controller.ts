import { Request, Response } from 'express';
import SettingsService from '../services/settings.service';

class SettingsController {
  async getAllSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getAllSettings();
      const settingsRsp = Object.fromEntries(settings.map(setting => [setting.dataValues.name, setting.dataValues.value]));
      res.json(settingsRsp);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getSettingsByName(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const settings = await SettingsService.getSettingsByName(name);
      if (settings) {
        res.json(settings);
      } else {
        res.status(404).json({ error: 'Settings not found' });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async createSettings(req: Request, res: Response) {
    try {
      const newSettings = await SettingsService.updateSettings(req.body);
      res.status(201).json(newSettings);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      await SettingsService.updateSettings(req.body);
      res.status(200).end();
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async deleteSettings(req: Request, res: Response) {
    try {
      const { name } = req.params;
      await SettingsService.deleteSettings(name);
      res.status(200).end();
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new SettingsController();