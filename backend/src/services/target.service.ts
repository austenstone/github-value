import mongoose from 'mongoose';
import adoptionService, { AdoptionType } from './adoption.service.js';
import app from '../index.js';
import { SettingsType } from './settings.service.js';

interface Target {
  current: number;
  target: number;
  max: number;
}

interface Targets {
  org: {
    seats: Target;
    adoptedDevs: Target;
    monthlyDevsReportingTimeSavings: Target;
    percentOfSeatsReportingTimeSavings: Target;
    percentOfSeatsAdopted: Target;
    percentOfMaxAdopted: Target;
  };
  user: {
    dailySuggestions: Target;
    dailyAcceptances: Target;
    dailyChatTurns: Target;
    dailyDotComChats: Target;
    weeklyPRSummaries: Target;
    weeklyTimeSavedHrs: Target;
  };
  impact: {
    monthlyTimeSavingsHrs: Target;
    annualTimeSavingsAsDollars: Target;
    productivityOrThroughputBoostPercent: Target;
  };
}

class TargetValuesService {
  async getTargetValues() {
    try {
      const Targets = mongoose.model('Targets');
      const targets = await Targets.findOne();
      return targets;
    } catch (error) {
      throw new Error(`Error fetching target values: ${error}`);
    }
  }

  async updateTargetValues(data: Targets) {
    try {
      const Targets = mongoose.model('Targets');
      const targets = await Targets.findOneAndUpdate({}, data, { new: true, upsert: true });
      return targets;
    } catch (error) {
      throw new Error(`Error updating target values: ${error}`);
    }
  }

  calculateTargets(settings: SettingsType, adoptions: AdoptionType[]): Targets {

    console.log('tmp', settings);

    const topAdoptions = adoptions
      .sort((a, b) => b.totalActive - a.totalActive)
      .slice(0, 10);

    const averages = topAdoptions.reduce((acc, curr) => {
      return {
        totalSeats: acc.totalSeats + curr.totalSeats,
        totalActive: acc.totalActive + curr.totalActive,
        totalInactive: acc.totalInactive + curr.totalInactive
      };
    }, { totalSeats: 0, totalActive: 0, totalInactive: 0 });

    const avgTotalSeats = Math.round(averages.totalSeats / topAdoptions.length);
    const avgTotalActive = Math.round(averages.totalActive / topAdoptions.length);

    return {
      org: {
        seats: { current: avgTotalSeats, target: avgTotalSeats, max: avgTotalSeats },
        adoptedDevs: { current: avgTotalActive, target: avgTotalActive, max: avgTotalSeats },
        monthlyDevsReportingTimeSavings: { current: 0, target: 0, max: avgTotalSeats },
        percentOfSeatsReportingTimeSavings: { current: 0, target: 0, max: 100 },
        percentOfSeatsAdopted: {
          current: Math.round((avgTotalActive / avgTotalSeats) * 100),
          target: Math.round((avgTotalActive / avgTotalSeats) * 100),
          max: 100
        },
        percentOfMaxAdopted: { current: 0, target: 0, max: 100 },
      },
      user: {
        dailySuggestions: { current: 0, target: 0, max: 0 },
        dailyAcceptances: { current: 0, target: 0, max: 0 },
        dailyChatTurns: { current: 0, target: 0, max: 0 },
        dailyDotComChats: { current: 0, target: 0, max: 0 },
        weeklyPRSummaries: { current: 0, target: 0, max: 0 },
        weeklyTimeSavedHrs: { current: 0, target: 0, max: 0 },
      },
      impact: {
        monthlyTimeSavingsHrs: { current: 0, target: 0, max: 0 },
        annualTimeSavingsAsDollars: { current: 0, target: 0, max: 0 },
        productivityOrThroughputBoostPercent: { current: 0, target: 0, max: 100 },
      },
    };
  }

  async initialize() {
    try {
      const Targets = mongoose.model('Targets');
      const existingTargets = await Targets.findOne();

      if (1 || !existingTargets) {
        const settings = await app.settingsService.getAllSettings();
        const adoptions = await adoptionService.getAllAdoptions2({
          filter: { enterprise: 'enterprise' },
          projection: {}
        });
        const initialData = this.calculateTargets(settings, adoptions);
        await Targets.create(initialData);
      }
    } catch (error) {
      throw new Error(`Error initializing target values: ${error}`);
    }
  }
}

export default new TargetValuesService();