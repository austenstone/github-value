import { components } from "@octokit/openapi-types";
import { SeatType } from "./seats.model.js";
import mongoose from "mongoose";

export type TeamType = Omit<components["schemas"]["team"], 'parent'> & {
  _id?: mongoose.Types.ObjectId;
  org: string;
  team?: string;
  parent_id?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  parent?: TeamType | null;
};

type MemberType = {
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

type MemberActivityType = {
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

type TeamMemberAssociationType = {
  TeamId: number;
  MemberId: number;
};

export {
  MemberType,
  TeamMemberAssociationType,
  MemberActivityType
};
