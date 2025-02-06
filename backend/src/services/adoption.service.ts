//Austen’s version
import mongoose from 'mongoose';
import logger from './logger.js';
import { SeatEntry } from './seats.service.js';

type AdoptionType = any;

export interface GetAdoptionsParams {
  enterprise?: string;
  org?: string;
  team?: string;
  daysInactive?: number;
  precision?: string;
  since?: string;
  until?: string;
  seats?: number;
}

export class AdoptionService {
  constructor() {
  }

  async createAdoption(adoptionData: any): Promise<AdoptionType> {
    const adoptionModel = mongoose.model('Adoption');
    try {
      const result = await adoptionModel.create(adoptionData);
      return result;
    } catch (error: any) {
      logger.error('Error creating adoption:', error);
      throw error; // Rethrow other errors
    }
  }
  

  async getAdoptionByDate(date: Date): Promise<AdoptionType | null> {
    const adoptionModel = mongoose.model<AdoptionType>('Adoption');
    try {
      return await adoptionModel
        .findOne({ date })
        .populate('seats');
    } catch (error) {
      logger.error('Error fetching adoption:', error);
      throw error;
    }
  }

  async updateAdoption(date: Date, updateData: Partial<AdoptionType>): Promise<AdoptionType | null> {
    const adoptionModel = mongoose.model<AdoptionType>('Adoption');
    try {
      return await adoptionModel
        .findOneAndUpdate({ date }, updateData, { new: true })
        .populate('seats');
    } catch (error) {
      logger.error('Error updating adoption:', error);
      throw error;
    }
  }

  async deleteAdoption(date: Date): Promise<boolean> {
    const adoptionModel = mongoose.model<AdoptionType>('Adoption');
    try {
      const result = await adoptionModel.deleteOne({ date });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Error deleting adoption:', error);
      throw error;
    }
  }

  async getAllAdoptions(): Promise<AdoptionType[]> {
    const adoptionModel = mongoose.model<AdoptionType>('Adoption');
    try {
      return await adoptionModel
        .find({}, { _id: 0, __v: 0, seats: 0 })
        .sort({ date: -1 });
    } catch (error) {
      logger.error('Error fetching all adoptions:', error);
      throw error;
    }
  }

  async getAllAdoptions2(params: any): Promise<AdoptionType[]> {
    const adoptionModel = mongoose.model<AdoptionType>('Adoption');

    try {
      return await adoptionModel.find(params.filter, params.projection)
        .sort({ date: 1 });
    } catch (error) {
      logger.error('Error fetching all adoptions:', error);
      throw error;
    }
  }

  calculateAdoptionTotals(queryAt: Date, data: SeatEntry[], daysInactive = 30) {
    return data.reduce((acc, activity) => {
      if (!activity.last_activity_at) {
        acc.totalInactive++;
        return acc;
      }
      const fromTime = (new Date(activity.last_activity_at)).getTime() || 0;
      const toTime = queryAt.getTime();
      const diff = Math.floor((toTime - fromTime) / 86400000);
      if (activity.last_activity_at && activity.last_activity_editor) {
        if (diff < daysInactive) {
          acc.totalActive++;
        } else {
          acc.totalInactive++;
        }
      }
      return acc;
    }, {
      totalSeats: data.length,
      totalActive: 0,
      totalInactive: 0,
    });
  }
}

export default new AdoptionService();
