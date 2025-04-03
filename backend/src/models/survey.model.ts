import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
  id: Number,
  userId: String,
  org: String,
  repo: String,
  prNumber: String,
  usedCopilot: Boolean,
  percentTimeSaved: Number,
  reason: String,
  timeUsedFor: String,
  kudos: Number,
  status: String,
  hits: Number
}, {
  timestamps: true
});

type SurveyType = {
  id?: number;
  userId: string;
  org: string;
  repo: string;
  prNumber: string;
  usedCopilot: boolean;
  percentTimeSaved: number;
  reason: string;
  timeUsedFor: string;
  kudos?: number;
  status: string;
  hits: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export { SurveyType };
export default surveySchema;