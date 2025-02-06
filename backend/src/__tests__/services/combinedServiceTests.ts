// combinedServiceTests.ts  run via "npx tsx src/__tests__/services/combinedServiceTests.ts"
import SurveyService from '../../services/survey.service.js';
import SeatService from '../../services/seats.service.js';
import metricsService from '../../services/metrics.service.js';
import { generateSurveys } from '../__mock__/survey-gen/runSurveyGenerator.js';
import { MockSeatsGenerator } from '../__mock__/seats-gen/mockSeatsGenerator.js';
import { MockMetricsGenerator } from '../__mock__/metrics-gen/mockGenerator.js';
import type { MockConfig, SeatsMockConfig } from '../__mock__/types.js';
import Database from '../../database.js';
import 'dotenv/config';
import fs from 'fs';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
const database = new Database(process.env.MONGODB_URI);

const metricsMockConfig: MockConfig = {
  startDate: new Date('2024-11-01'),
  endDate: new Date('2024-12-02'),
  updateFrequency: 'daily',
  metrics: {
    total_active_users: {
      baseValue: 24,
      range: { min: 24, max: 24 },
      trend: 'fixed'
    },
    total_engaged_users: {
      baseValue: 20,
      range: { min: 20, max: 20 },
      trend: 'fixed'
    },
    code_suggestions: {
      baseValue: 249,
      range: { min: 249, max: 249 },
      trend: 'fixed'
    },
    code_acceptances: {
      baseValue: 123,
      range: { min: 123, max: 123 },
      trend: 'fixed'
    },
    code_lines_suggested: {
      baseValue: 225,
      range: { min: 225, max: 225 },
      trend: 'fixed'
    },
    code_lines_accepted: {
      baseValue: 135,
      range: { min: 135, max: 135 },
      trend: 'fixed'
    },
    chats: {
      baseValue: 45,
      range: { min: 45, max: 45 },
      trend: 'fixed'
    },
    chat_insertions: {
      baseValue: 12,
      range: { min: 12, max: 12 },
      trend: 'fixed'
    },
    chat_copies: {
      baseValue: 16,
      range: { min: 16, max: 16 },
      trend: 'fixed'
    },
    pr_summaries: {
      baseValue: 6,
      range: { min: 6, max: 6 },
      trend: 'fixed'
    },
    total_code_reviews: {
      baseValue: 10,
      range: { min: 10, max: 10 },
      trend: 'fixed'
    },
    total_code_review_comments: {
      baseValue: 30,
      range: { min: 30, max: 30 },
      trend: 'fixed'
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
  endDate: new Date('2024-11-07'),
  usagePattern: 'heavy',
  heavyUsers: ['nathos', 'arfon', 'kyanny'],
  editors: [
    'copilot-chat-platform',
    'vscode/1.96.2/copilot/1.254.0',
    'GitHubGhostPilot/1.0.0/unknown',
    'vscode/1.96.2/',
    'vscode/1.97.0-insider/copilot-chat/0.24.2024122001'
  ]
};

function generateExampleMetricsData() {
      console.log('Generating example metrics data...', metricsMockConfig.startDate, metricsMockConfig.endDate);
  const mockGenerator = new MockMetricsGenerator(metricsMockConfig);
  return mockGenerator.generateMetrics(metricsMockConfig);
}

function generateExampleSeatsData() {
  const mockGenerator = new MockSeatsGenerator(seatsMockConfig, { seats: [] });
  return mockGenerator.generateMetrics();
}

async function runSurveyTest() {
  console.log('Running Survey Test...');
  const surveys = generateSurveys();
  console.log('Generated surveys:', surveys.surveys.length);
  for (const survey of surveys.surveys) {
    await SurveyService.createSurvey(survey);
  }
  //const insertedSurveys = await SurveyService.getRecentSurveysWithGoodReasons(5);
  
  // console.log('Inserted Surveys:', insertedSurveys);
}

async function runSeatTest() {
  console.log('Running Seat Test...');
  const org = 'octodemo';
  const queryAt = new Date();
  const seats = generateExampleSeatsData();
      console.log('Generated seats:', seats.length);
  const seatsExample = JSON.parse(fs.readFileSync('../__mock__/seats-gen/seatsExample.json', 'utf8'));
  await SeatService.insertSeats(org, queryAt, seatsExample.seats);
//   const insertedSeats = await SeatService.getAllSeats(org);
//   if (!insertedSeats || insertedSeats.length === 0) {
//     throw new Error('No seats were inserted.');
//   }
//   if (insertedSeats[0].org !== org) {
//     console.log('Received org:', insertedSeats[0].org);
//     throw new Error('Organization mismatch.');
//   }
}

async function runMetricsTest() {
  console.log('Running Metrics Test...');
  const exampleData: any = generateExampleMetricsData(); // : MetricDailyResponseType[]
  console.log('Generated metrics:', exampleData.length);
  for (const metric of exampleData) {
    await metricsService.insertMetrics("octodemo", [metric]);
  }

}

async function runTests() {
  try {
    await database.connect();
    await runSurveyTest();
    await runSeatTest();
    await runMetricsTest();
    console.log('All tests passed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await database.disconnect();
  }
}

runTests();
