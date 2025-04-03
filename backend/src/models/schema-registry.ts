import mongoose from 'mongoose';
import settingsSchema from './settings.model.js';
import usageSchema from './usage.model.js';
import metricsSchema from './metrics.model.js';
import teamsSchema, { memberSchema, teamMemberSchema } from './teams.model.js';
import seatsSchema from './seats.model.js';
import adoptionSchema from './adoption.model.js';
import activityTotalsSchema from './activity-totals.model.js';
import surveySchema from './survey.model.js';
import targetSchema from './target.model.js';
import counterSchema from './counter.model.js';

export function setupSchemas() {
  mongoose.model('Settings', settingsSchema);
  mongoose.model('Usage', usageSchema);
  mongoose.model('Metrics', metricsSchema);
  mongoose.model('Team', teamsSchema);
  mongoose.model('Member', memberSchema);
  mongoose.model('TeamMember', teamMemberSchema);
  mongoose.model('Seats', seatsSchema);
  mongoose.model('Adoption', adoptionSchema);
  mongoose.model('ActivityTotals', activityTotalsSchema);
  mongoose.model('Survey', surveySchema);
  mongoose.model('Targets', targetSchema);
  mongoose.model('Counter', counterSchema);
}