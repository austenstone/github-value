import { Schema } from 'mongoose';

const adoptionSchema = new Schema({
  enterprise: String,
  org: String,
  team: String,
  date: {
    type: Date,
    required: true
  },
  totalSeats: Number,
  totalActive: Number,
  totalInactive: Number,
  seats: [{
    login: String,
    last_activity_at: Date,
    last_activity_editor: String,
    _assignee: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: 'Member'
    },
    _seat: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: 'Seats'
    }
  }]
}, {
  timestamps: true
});

// Create indexes
adoptionSchema.index({ enterprise: 1, org: 1, team: 1, date: 1 }, { unique: true });

type AdoptionSeatType = {
  login: string;
  last_activity_at: Date;
  last_activity_editor: string;
  _assignee: Schema.Types.ObjectId;
  _seat: Schema.Types.ObjectId;
}

type AdoptionType = {
  enterprise?: string;
  org: string;
  team?: string;
  date: Date;
  totalSeats: number;
  totalActive: number;
  totalInactive: number;
  seats: AdoptionSeatType[];
  createdAt?: Date;
  updatedAt?: Date;
}

export { AdoptionType, AdoptionSeatType };
export default adoptionSchema;
