import mongoose, { Schema } from 'mongoose';
import { components } from "@octokit/openapi-types";
import { SeatType } from "./seats.model.js";

const teamSchema = new Schema({
  org: { type: String, required: true },
  team: String,
  githubId: { type: Number, required: true, unique: true },
  node_id: String,
  name: String,
  slug: String,
  description: String,
  privacy: String,
  notification_setting: String,
  permission: String,
  url: String,
  html_url: String,
  members_url: String,
  repositories_url: String,
  parent: { type: Schema.Types.ObjectId, ref: 'Team' }
}, {
  timestamps: true
});

const memberSchema = new Schema({
  org: { type: String, required: true },
  login: { type: String, required: true },
  id: { type: Number, required: true },
  node_id: String,
  avatar_url: String,
  gravatar_id: String,
  url: String,
  html_url: String,
  followers_url: String,
  following_url: String,
  gists_url: String,
  starred_url: String,
  subscriptions_url: String,
  organizations_url: String,
  repos_url: String,
  events_url: String,
  received_events_url: String,
  type: String,
  site_admin: Boolean,
  name: String,
  email: String,
  starred_at: String,
  user_view_type: String,
  seat: {
    type: Schema.Types.ObjectId,
    ref: 'Seats'
  }
}, {
  timestamps: true,
});

memberSchema.index({ org: 1, login: 1, id: 1 }, { unique: true });
memberSchema.index({ seat: 1 });
memberSchema.index({ updatedAt: -1 });
memberSchema.virtual('seats', {
  ref: 'Seats',
  localField: '_id',
  foreignField: 'assignee'
});

const teamMemberSchema = new Schema({
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  member: { type: Schema.Types.ObjectId, ref: 'Member', required: true }
}, {
  timestamps: false
});

teamMemberSchema.index({ team: 1, member: 1 }, { unique: true });

export type TeamType = Omit<components["schemas"]["team"], 'parent'> & {
  _id?: mongoose.Types.ObjectId;
  org: string;
  team?: string;
  parent_id?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  parent?: TeamType | null;
};

export type MemberType = {
  org: string;
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  email: string | null;
  starred_at?: string;
  user_view_type?: string;
  createdAt?: Date;
  updatedAt?: Date;
  activity?: SeatType[];
};

export type MemberActivityType = {
  org: string;
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  email: string | null;
  starred_at?: string;
  user_view_type?: string;
  createdAt?: Date;
  updatedAt?: Date;
  activity: SeatType[];
};

export type TeamMemberAssociationType = {
  TeamId: number;
  MemberId: number;
};

export { teamSchema as default, memberSchema, teamMemberSchema };
