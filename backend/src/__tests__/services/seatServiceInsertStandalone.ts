// seatServiceInsertStandalone.ts  run via "npx tsx src/__tests__/services/seatServiceInsertStandalone.ts"
import SeatService from '../../services/seats.service.js';
import { generateStatefulMetrics } from '../__mock__/seats-gen/runSeatsGenerator.js';
import Database from '../../database.js';
import 'dotenv/config';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
const database = new Database(process.env.MONGODB_URI);

async function runTest() {
  try {
    await database.connect();

    // Test data setup
    const org = 'octodemo';
    const queryAt = new Date();
    const seats  = generateStatefulMetrics();


    //loop through each seat and if the last_activity_at is "false" print the seat object to console.
      seats.seats.forEach((seat: any) => {
        if (seat.last_activity_at === "false") {
            console.log("a false last activity was found", seat);
        }
      });
    // Perform the insertion
    await SeatService.insertSeats(org, queryAt, seats.seats);

    // Verify the insertion
    const insertedSeats = await SeatService.getAllSeats(org);

    // Assertions
    //console.log('Inserted Seats:', insertedSeats);
    if (!insertedSeats || insertedSeats.length === 0) {
      throw new Error('No seats were inserted.');
    }
    if (insertedSeats[0].org !== org) {
      console.log('Received org:', insertedSeats[0].org);
      throw new Error('Organization mismatch.');
    }
    if (insertedSeats[0].queryAt.getTime() !== queryAt.getTime()) {
      throw new Error('QueryAt mismatch.');
    }

    console.log('Test passed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await database.disconnect();
  }
}

runTest();
