import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

type CounterType = {
  _id: string;
  seq: number;
}

export { CounterType };
export default counterSchema;