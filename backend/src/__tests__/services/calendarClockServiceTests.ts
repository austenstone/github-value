// calendarClockServiceTests.ts run via "npx tsx src/__tests__/services/calendarClockServiceTests.ts"
import SurveyService from '../../services/survey.service.js';
import SeatService from '../../services/seats.service.js';
import metricsService from '../../services/metrics.service.js';
import TeamsService from '../../services/teams.service.js';
import { runSurveysForDate } from '../__mock__/survey-gen/runSurveyGenerator.js';
import { MockSeatsGenerator } from '../__mock__/seats-gen/mockSeatsGenerator.js';
import { MockMetricsGenerator } from '../__mock__/metrics-gen/mockGenerator.js';
import type { MockConfig, SeatsMockConfig } from '../__mock__/types.js';
import { MetricDailyResponseType } from '../../models/metrics.model.js';
import Database from '../../database.js';
import 'dotenv/config';
//import seatsExample from '../__mock__/seats-gen/seats.json'; //50 users
//import seatsExample from '../__mock__/seats-gen/seats2.json'; //100 users
import seatsExample from '../__mock__/seats-gen/merged_seats.json'; //1000 users


let membersOas: any[] = []; //octoaustenstone org
let membersOcto: any[] = []; //octodemo org
let seatsInitialized: boolean = false;
let seatsExampleInitialized: any;
let counter = 0;

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
const database = new Database(process.env.MONGODB_URI);

const metricsMockConfig: MockConfig = {
  startDate: new Date('2024-11-01'),
  endDate: new Date('2024-11-02'),
  updateFrequency: 'daily',
  metrics: {
    total_active_users: {
      baseValue: 100,
      range: { min: 14, max: 1000 },
      trend: 'grow'
    },
    total_engaged_users: {
      baseValue: 80,
      range: { min: 10, max: 900 },
      trend: 'grow'
    },
    code_suggestions: {
      baseValue: 800,
      range: { min: 150, max: 1000 },
      trend: 'grow'
    },
    code_acceptances: {
      baseValue: 180,
      range: { min: 40, max: 250 },
      trend: 'grow'
    },
    code_lines_suggested: {
      baseValue: 2500,
      range: { min: 2250, max: 5000 },
      trend: 'grow'
    },
    code_lines_accepted: {
      baseValue: 1400,
      range: { min: 750, max: 1955 },
      trend: 'grow'
    },
    chats: {
      baseValue: 60,
      range: { min: 35, max: 75 },
      trend: 'grow'
    },
    chat_insertions: {
      baseValue: 150,
      range: { min: 120, max: 300 },
      trend: 'grow'
    },
    chat_copies: {
      baseValue: 190,
      range: { min: 160, max: 460 },
      trend: 'stable'
    },
    pr_summaries: {
      baseValue: 80,
      range: { min: 60, max: 160 },
      trend: 'grow'
    },
    total_code_reviews: {
      baseValue: 60,
      range: { min: 25, max: 100 },
      trend: 'grow'
    },
    total_code_review_comments: {
      baseValue: 40,
      range: { min: 30, max: 60 },
      trend: 'grow'
    }
  },
  models: [
    { name: 'default', is_custom_model: false, custom_model_training_date: null },
    { name: 'a-custom-model', is_custom_model: true, custom_model_training_date: '2024-02-01' }
  ],
  languages: ['python', 'ruby', 'typescript', 'go'],
  editors: ['vscode', 'neovim'],
  repositories: ['demo/repo1', 'demo/repo2']
};

const seatsMockConfig: SeatsMockConfig = {
  startDate: new Date('2024-11-01'),
  endDate: new Date('2025-01-07'),
  usagePattern: 'moderate',
  heavyUsers: ['nathos', 'arfon', 'kyanny', 'amandahmt', 'jefeish', 'sdehm', 'dgreif', 'matthewisabel', '2percentsilk', 'mariorod'],
  specificUser: 'nathos',
  editors: [
    'copilot-chat-platform',
    'vscode/1.96.2/copilot/1.254.0',
    'GitHubGhostPilot/1.0.0/unknown',
    'vscode/1.96.2/',
    'vscode/1.97.0-insider/copilot-chat/0.24.2024122001'
  ]
};

function generateMetricsData(datetime: Date) {
  metricsMockConfig.startDate = datetime
  metricsMockConfig.endDate = datetime
  //add other configuration as needed

  console.log('Generating example metrics data...', metricsMockConfig.startDate, metricsMockConfig.endDate);
  const mockGenerator = new MockMetricsGenerator(metricsMockConfig);
  return mockGenerator.generateMetrics(metricsMockConfig);
}

function initializeAllSeats(templateData: any, simTime: Date) {
  // Initialize last activity times for all users
  templateData.seats.forEach((seat: any) => {
    // Use lastActivityAt as needed
    seat.last_activity_at = new Date(new Date(simTime).getTime() - 1000 * 60 * 60 * 24 * 2 * templateData.seats.indexOf(seat));
  });
  return templateData;
}

function generateSeatsData(datetime: Date) {
  seatsMockConfig.startDate = datetime
  seatsMockConfig.endDate = datetime
  //add other configuration as needed
  let seatsTemplate = JSON.parse(JSON.stringify(seatsExample));

  const mockGenerator = new MockSeatsGenerator(seatsMockConfig, seatsTemplate);
  seatsTemplate = mockGenerator.generateSeats(counter);

  return seatsTemplate
}

async function runSurveyGen(datetime: Date) {
  if (datetime.getDay() >= 1 && datetime.getDay() <= 5 && datetime.getHours() >= 6 && datetime.getHours() <= 23 && Math.random() < 0.5) {
    if (Math.random() < 0.7 + counter / 7000) {
      console.log('Running Survey Generation...', datetime);
      const surveys = await runSurveysForDate(datetime);
      for (const survey of surveys.surveys) {
        await SurveyService.createSurvey(survey);
        console.log('Survey created:', survey);
      }
    }
  }
}

async function runSeatsGen(datetime: Date) {
  console.log('Running Seats Generation...', datetime);

  const orgOcto = 'octodemo';
  const orgOas = 'octoaustenstone';
  if (seatsInitialized == false) {
    seatsInitialized = true;
    seatsExampleInitialized = initializeAllSeats(seatsExample, datetime);
    //seatsExample2Initialized = initializeAllSeats(seatsExample2, datetime);
  }
  //call generateSeatsData for each member of the org by looping through the members array
  let newSeats = generateSeatsData(datetime);
  await SeatService.insertSeats(orgOcto, datetime, newSeats);
  //I need to patch seatsExampleInitialized with the new data
  for (const seat of newSeats) {
    const seatIndex = seatsExampleInitialized.seats.findIndex((s: any) => s.user === seat.user);
    if (seatIndex !== -1) {
      seatsExampleInitialized.seats[seatIndex].last_activity_at = seat.last_activity_at;
    }
  }
}

async function runMetricsGen(datetime: Date) {
  if (datetime.getHours() === 23) {
    console.log('Running Metrics Generation...', datetime);
    const exampleData: MetricDailyResponseType[] = generateMetricsData(datetime);
    for (const metric of exampleData) {
      await metricsService.insertMetrics("octodemo", exampleData);
    }
  }
}

async function calendarClock() {
  let datetime = new Date('2024-12-30T01:00:00');
  const endDate = new Date('2025-02-01T00:00:00');
  console.log('datetime:', datetime.getTime());
  console.log('endDate:', endDate.getTime());
  membersOcto = await TeamsService.getAllMembers('octodemo');
  membersOas = await TeamsService.getAllMembers('octoaustenstone');
  console.log('count Octo members:', membersOcto.length);

  console.log('count octoaustenstone members:', membersOas.length);

  while (datetime.getTime() < endDate.getTime()) {
    await runSurveyGen(datetime);
    await runSeatsGen(datetime);
    await runMetricsGen(datetime);

    datetime.setHours(datetime.getHours() + 1);
    counter += 1;
    console.log('datetime:    >', datetime);
  }


}

async function runClock() {
  let retryCount = 0;
  const maxRetries = 5;
  let connected = false;
  seatsInitialized = false;
  console.log('Starting clock...');
  console.log('seats', seatsExample.seats.length);

  while (retryCount < maxRetries) {
    try {
      if (!connected) {
        await database.connect();
        connected = true;
      }

      await calendarClock();
      console.log('All Clock-Triggered Generations worked successfully.');
      break;

    } catch (error) {
      retryCount++;
      console.error(`Attempt ${retryCount}/${maxRetries} failed:`, error.message);

      if (error.name === 'MongoServerSelectionError' ||
        error.name === 'MongoNetworkError' ||
        (error.code && error.code === 10107)) {  // Not Primary error code

        // Wait with exponential backoff before retrying
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`Primary failover detected. Waiting ${backoffTime / 1000} seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));

        // Force reconnection
        try {
          await database.disconnect();
          connected = false;
        } catch (disconnectError) {
          console.log('Disconnect error (can be ignored):', disconnectError.message);
        }

        continue;
      }

      throw error;
    }
  }

  if (retryCount === maxRetries) {
    console.error('Max retries reached. Giving up.');
  }

  if (connected) {
    try {
      await database.disconnect();
    } catch (disconnectError) {
      console.error('Error during final disconnect:', disconnectError.message);
    }
  }
}
runClock();