//seatServiceInsert.spec.ts run via "npx tsx src/__tests__/services/seatServiceInsert.spec.ts"
import { describe, expect, test, it, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import SeatService from '../../services/seats.service.js';
import { SeatsMockConfig } from '../__mock__/types.js';
import { SeatType } from '../../models/seats.model.js';
import 'dotenv/config';
import Database from '../../database.js';
import { generateStatelessMetrics } from '../__mock__/seats-gen/runSeatsGenerator.js';
import { now } from 'mongoose';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
      const database = new Database(process.env.MONGODB_URI);
      

beforeAll(async () => {
      await database.connect();
    });

describe('SeatService', () => {
  describe('insertSeats', () => {
      it('should insert seats correctly', async () => {
            try {
              // Test data setup
              const org = 'test-org';
              const queryAt = new Date(now());
              const seats = generateStatelessMetrics();
          
              // Perform the insertion
              await SeatService.insertSeats(org, queryAt, seats);
          
              // Verify the insertion
              const insertedSeats = await SeatService.getAllSeats(org);
              
              // Assertions
              expect(insertedSeats).toBeDefined();
              expect(insertedSeats.length).toBeGreaterThan(0);
              expect(insertedSeats[0].organization).toBe(org);
              expect(insertedSeats[0].queryAt).toEqual(queryAt);
              
              // Verify the structure of inserted seats
              const firstSeat = insertedSeats[0];
              expect(firstSeat).toMatchObject({
                organization: org,
                queryAt: queryAt,
                // Add other expected properties based on your data model
              });
          
            } catch (error) {
              console.error('Test failed:', error);
              throw error;
            }
          });
    });
  });

afterAll(async () => {
      await database.disconnect();
    });
