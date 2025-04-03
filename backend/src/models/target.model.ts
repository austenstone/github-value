import mongoose from 'mongoose';

const TargetSchema = new mongoose.Schema({
  current: Number,
  target: Number,
  max: Number
});

const TargetsSchema = new mongoose.Schema({
  org: {
    seats: TargetSchema,
    adoptedDevs: TargetSchema,
    monthlyDevsReportingTimeSavings: TargetSchema,
    percentOfSeatsReportingTimeSavings: TargetSchema,
    percentOfSeatsAdopted: TargetSchema,
    percentOfMaxAdopted: TargetSchema
  },
  user: {
    dailySuggestions: TargetSchema,
    dailyAcceptances: TargetSchema,
    dailyChatTurns: TargetSchema,
    dailyDotComChats: TargetSchema,
    weeklyPRSummaries: TargetSchema,
    weeklyTimeSavedHrs: TargetSchema
  },
  impact: {
    monthlyTimeSavingsHrs: TargetSchema,
    annualTimeSavingsAsDollars: TargetSchema,
    productivityOrThroughputBoostPercent: TargetSchema
  }
}, {
  timestamps: true
});

type TargetMetricType = {
  current: number;
  target: number;
  max: number;
}

type TargetValuesType = {
  org: {
    seats: TargetMetricType;
    adoptedDevs: TargetMetricType;
    monthlyDevsReportingTimeSavings: TargetMetricType;
    percentOfSeatsReportingTimeSavings: TargetMetricType;
    percentOfSeatsAdopted: TargetMetricType;
    percentOfMaxAdopted: TargetMetricType;
  };
  user: {
    dailySuggestions: TargetMetricType;
    dailyAcceptances: TargetMetricType;
    dailyChatTurns: TargetMetricType;
    dailyDotComChats: TargetMetricType;
    weeklyPRSummaries: TargetMetricType;
    weeklyTimeSavedHrs: TargetMetricType;
  };
  impact: {
    monthlyTimeSavingsHrs: TargetMetricType;
    annualTimeSavingsAsDollars: TargetMetricType;
    productivityOrThroughputBoostPercent: TargetMetricType;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export { TargetValuesType, TargetMetricType };
export default TargetsSchema;
