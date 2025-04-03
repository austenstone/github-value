import mongoose, { Schema } from 'mongoose';

const activityTotalsSchema = new mongoose.Schema({
  org: String,
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'Member'
  },
  assignee_id: Number,
  assignee_login: String,
  date: Date,
  total_active_time_ms: Number,
  last_activity_at: Date,
  last_activity_editor: String
}, {
  timestamps: true
});

activityTotalsSchema.index({ org: 1, date: 1, assignee: 1 }, { unique: true });
activityTotalsSchema.index({ date: 1 }); // For date range queries

type ActivityTotalType = {
  org: string;
  assignee: Schema.Types.ObjectId;
  assignee_id: number;
  assignee_login: string;
  date: Date;
  total_active_time_ms: number;
  last_activity_at: Date;
  last_activity_editor: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export { ActivityTotalType };
export default activityTotalsSchema;