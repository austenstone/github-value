import { Request, Response } from 'express';
import TargetValuesService from '../services/target.service.js';

class TargetValuesController {
  async getTargetValues(req: Request, res: Response): Promise<void> {
    try {
      const targetValues = await TargetValuesService.getTargetValues();
      res.status(200).json(targetValues);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async updateTargetValues(req: Request, res: Response): Promise<void> {
    try {
      const updatedTargetValues = await TargetValuesService.updateTargetValues({
        current: {
          seats: req.body.current.seats,
          adoptedDevs: req.body.current.adoptedDevs,
          monthlyDevsReportingTimeSavings: req.body.current.monthlyDevsReportingTimeSavings,
          percentSeatsReportingTimeSavings: req.body.current.percentSeatsReportingTimeSavings,
          percentSeatsAdopted: req.body.current.percentSeatsAdopted,
          percentMaxAdopted: req.body.current.percentMaxAdopted,
          dailySuggestions: req.body.current.dailySuggestions,
          dailyChatTurns: req.body.current.dailyChatTurns,
          weeklyPRSummaries: req.body.current.weeklyPRSummaries,
          weeklyTimeSaved: req.body.current.weeklyTimeSaved,
          monthlyTimeSavings: req.body.current.monthlyTimeSavings,
          annualTimeSavingsDollars: req.body.current.annualTimeSavingsDollars,
          productivityBoost: req.body.current.productivityBoost,
          dailyAcceptances: req.body.current.dailyAcceptances,
          dailyDotComChats: req.body.current.dailyDotComChats,
          asOfDate: req.body.current.asOfDate,
        },
        target: {
          seats: req.body.target.seats,
          adoptedDevs: req.body.target.adoptedDevs,
          monthlyDevsReportingTimeSavings: req.body.target.monthlyDevsReportingTimeSavings,
          percentSeatsReportingTimeSavings: req.body.target.percentSeatsReportingTimeSavings,
          percentSeatsAdopted: req.body.target.percentSeatsAdopted,
          percentMaxAdopted: req.body.target.percentMaxAdopted,
          dailySuggestions: req.body.target.dailySuggestions,
          dailyChatTurns: req.body.target.dailyChatTurns,
          weeklyPRSummaries: req.body.target.weeklyPRSummaries,
          weeklyTimeSaved: req.body.target.weeklyTimeSaved,
          monthlyTimeSavings: req.body.target.monthlyTimeSavings,
          annualTimeSavingsDollars: req.body.target.annualTimeSavingsDollars,
          productivityBoost: req.body.target.productivityBoost,
          dailyAcceptances: req.body.target.dailyAcceptances,
          dailyDotComChats: req.body.target.dailyDotComChats,
        },
        max: {
          seats: req.body.max.seats,
          adoptedDevs: req.body.max.adoptedDevs,
          monthlyDevsReportingTimeSavings: req.body.max.monthlyDevsReportingTimeSavings,
          percentSeatsReportingTimeSavings: req.body.max.percentSeatsReportingTimeSavings,
          percentSeatsAdopted: req.body.max.percentSeatsAdopted,
          percentMaxAdopted: req.body.max.percentMaxAdopted,
          dailySuggestions: req.body.max.dailySuggestions,
          dailyChatTurns: req.body.max.dailyChatTurns,
          weeklyPRSummaries: req.body.max.weeklyPRSummaries,
          weeklyTimeSaved: req.body.max.weeklyTimeSaved,
          monthlyTimeSavings: req.body.max.monthlyTimeSavings,
          annualTimeSavingsDollars: req.body.max.annualTimeSavingsDollars,
          productivityBoost: req.body.max.productivityBoost,
          dailyAcceptances: req.body.max.dailyAcceptances,
          dailyDotComChats: req.body.max.dailyDotComChats,
        },
      });
      res.status(200).json(updatedTargetValues);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new TargetValuesController();
