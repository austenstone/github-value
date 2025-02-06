import mongoose from 'mongoose';

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

  async updateTargetValues(data: {
    current: {
      seats: number;
      adoptedDevs: number;
      monthlyDevsReportingTimeSavings: number;
      percentSeatsReportingTimeSavings: number;
      percentSeatsAdopted: number;
      percentMaxAdopted: number;
      dailySuggestions: number;
      dailyChatTurns: number;
      weeklyPRSummaries: number;
      weeklyTimeSaved: number;
      monthlyTimeSavings: number;
      annualTimeSavingsDollars: number;
      productivityBoost: number;
      dailyAcceptances: number;
      dailyDotComChats: number;
      asOfDate: number;
    };
    target: {
      seats: number;
      adoptedDevs: number;
      monthlyDevsReportingTimeSavings: number;
      percentSeatsReportingTimeSavings: number;
      percentSeatsAdopted: number;
      percentMaxAdopted: number;
      dailySuggestions: number;
      dailyChatTurns: number;
      weeklyPRSummaries: number;
      weeklyTimeSaved: number;
      monthlyTimeSavings: number;
      annualTimeSavingsDollars: number;
      productivityBoost: number;
      dailyAcceptances: number;
      dailyDotComChats: number;
    };
    max: {
      seats: number;
      adoptedDevs: number;
      monthlyDevsReportingTimeSavings: number;
      percentSeatsReportingTimeSavings: number;
      percentSeatsAdopted: number;
      percentMaxAdopted: number;
      dailySuggestions: number;
      dailyChatTurns: number;
      weeklyPRSummaries: number;
      weeklyTimeSaved: number;
      monthlyTimeSavings: number;
      annualTimeSavingsDollars: number;
      productivityBoost: number;
      dailyAcceptances: number;
      dailyDotComChats: number;
    };
  }) {
    try {
      const Targets = mongoose.model('Targets');
      const targets = await Targets.findOneAndUpdate({}, data, { new: true, upsert: true });
      return targets;
    } catch (error) {
      throw new Error(`Error updating target values: ${error}`);
    }
  }
}

export default new TargetValuesService();