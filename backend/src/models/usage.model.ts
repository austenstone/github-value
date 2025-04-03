import { Endpoints } from '@octokit/types';
import mongoose from 'mongoose';

const usageBreakdownSchema = new mongoose.Schema({
  language: String,
  editor: String,
  suggestions_count: Number,
  acceptances_count: Number,
  lines_suggested: Number,
  lines_accepted: Number,
  active_users: Number
});

const usageSchema = new mongoose.Schema({
  org: String,
  team: String,
  day: Date,
  total_suggestions_count: Number,
  total_acceptances_count: Number,
  total_lines_suggested: Number,
  total_lines_accepted: Number,
  total_active_users: Number,
  total_chat_acceptances: Number,
  total_chat_turns: Number,
  total_active_chat_users: Number,
  breakdown: [usageBreakdownSchema]
});

type UsageType = {
  org: string;
  team?: string;
  day: Date;
  total_suggestions_count: number;
  total_acceptances_count: number;
  total_lines_suggested: number;
  total_lines_accepted: number;
  total_active_users: number;
  total_chat_acceptances: number;
  total_chat_turns: number;
  total_active_chat_users: number;
  breakdown: UsageBreakdownType[];
}

type UsageBreakdownType = {
  language: string;
  editor: string;
  suggestions_count: number;
  acceptances_count: number;
  lines_suggested: number;
  lines_accepted: number;
  active_users: number;
}

async function insertUsage(org: string, data: Endpoints["GET /orgs/{org}/copilot/usage"]["response"]["data"]) {
  for (const metrics of data) {
    const Usage = mongoose.model('Usage');
    
    await Usage.findOneAndUpdate(
      { day: metrics.day },
      { ...metrics },
      { upsert: true }
    );
  }
}

export { UsageType, UsageBreakdownType, insertUsage };
export default usageSchema;