import { Schema } from 'mongoose';

// Language Schema 📝
export const LanguageSchema = new Schema({
  name: String,
  total_engaged_users: Number,
  total_code_acceptances: Number,
  total_code_suggestions: Number,
  total_code_lines_accepted: Number,
  total_code_lines_suggested: Number
});

// Model Schema 🤖
export const ModelSchema = new Schema({
  name: String,
  is_custom_model: Boolean,
  total_engaged_users: Number,
  total_code_acceptances: Number,
  total_code_suggestions: Number,
  total_code_lines_accepted: Number,
  total_code_lines_suggested: Number,
  languages: [LanguageSchema],
  total_chats: Number,
  total_chat_copy_events: Number,
  total_chat_insertion_events: Number,
  total_pr_summaries_created: Number
});

// Editor Schema 🖥️
export const EditorSchema = new Schema({
  name: String,
  total_engaged_users: Number,
  total_code_acceptances: Number,
  total_code_suggestions: Number,
  total_code_lines_accepted: Number,
  total_code_lines_suggested: Number,
  models: [ModelSchema],
  total_chats: Number,
  total_chat_copy_events: Number,
  total_chat_insertion_events: Number
});

// Repository Schema 📚
export const RepositorySchema = new Schema({
  name: String,
  total_engaged_users: Number,
  total_pr_summaries_created: Number,
  models: [ModelSchema]
});