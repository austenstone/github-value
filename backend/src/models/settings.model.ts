import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  name: String,
  value: {} // Mongoose will accept any object here
});

type SettingsType = {
  name: string;
  value: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export { SettingsType };
export default settingsSchema;