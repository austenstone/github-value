import mongoose, { Schema } from 'mongoose';

const seatsSchema = new mongoose.Schema({
  org: String,
  team: String,
  created_at: Date,
  updated_at: Date,
  pending_cancellation_date: Date,
  last_activity_at: Date,
  last_activity_editor: String,
  plan_type: String,
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'Member'
  },
  queryAt: Date,
  assignee_id: Number,
  assignee_login: String,
}, {
  timestamps: true
});

seatsSchema.index({ org: 1, queryAt: 1, last_activity_at: -1 });
seatsSchema.index({ org: 1, team: 1, queryAt: 1, assignee_id: 1 }, { unique: true });

type SeatType = {
  org: string;
  team?: string;
  created_at: Date;
  updated_at: Date;
  pending_cancellation_date?: Date;
  last_activity_at?: Date;
  last_activity_editor?: string;
  plan_type?: string;
  assignee?: Schema.Types.ObjectId;
  queryAt: Date;
  assignee_id: number;
  assignee_login: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export { SeatType };
export default seatsSchema;