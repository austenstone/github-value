import app from '../index.js';
import { Request, Response } from 'express';

class SettingsController {
  async getAllSettings(req: Request, res: Response) {
    try {
      const settings = await app.settingsService.getAllSettings();
      if (!settings) {
        res.status(404).json({ error: 'Settings not found' });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getSettingsByName(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const settings = await app.settingsService.getSettingsByName(name);
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
      const newSettings = await app.settingsService.updateSettings(req.body);
      res.status(201).json(newSettings);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      await app.settingsService.updateSettings(req.body);
      res.status(200).end();
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async deleteSettings(req: Request, res: Response) {
    try {
      const { name } = req.params;
      await app.settingsService.deleteSettings(name);
      res.status(200).end();
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new SettingsController();