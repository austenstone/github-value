import settingsService, { SettingsType } from './settings.service.js';
import adoptionService, { AdoptionType } from './adoption.service.js';
import metricsService from './metrics.service.js';
import { MetricDailyResponseType } from "../models/metrics.model.js";
import copilotSurveyService from './survey.service.js';
import { SurveyType } from './survey.service.js'; // Import from survey.service.js instead
import app from '../index.js';
import dayjs from 'dayjs';

// Define types for calculation logging
interface CalcLogType {
  name: string;
  inputs: Record<string, unknown>;
  formula: string;
  result: unknown;
}

// Carefully typed interfaces based on actual service data structures
interface Target {
  current: number;
  target: number;
  max: number;
}

interface Targets {
  org: {
    seats: Target;
    adoptedDevs: Target;
    monthlyDevsReportingTimeSavings: Target;
    percentOfSeatsReportingTimeSavings: Target;
    percentOfSeatsAdopted: Target;
    percentOfMaxAdopted: Target;
  };
  user: {
    dailySuggestions: Target;
    dailyAcceptances: Target;
    dailyChatTurns: Target;
    dailyDotComChats: Target;
    weeklyPRSummaries: Target;
    weeklyTimeSavedHrs: Target;
  };
  impact: {
    monthlyTimeSavingsHrs: Target;
    annualTimeSavingsAsDollars: Target;
    productivityOrThroughputBoostPercent: Target;
  };
  [key: string]: Record<string, Target>;
}

// More specific typed interfaces for metrics data
interface MetricsData {
  copilot_ide_code_completions?: {
    total_code_suggestions: number;
  };
  copilot_ide_chat?: {
    total_chats: number;
  };
  copilot_dotcom_pull_requests?: {
    total_pr_summaries_created: number;
  };
  total_active_users: number;
}

export class TargetCalculationService {
  // Class variables to store fetched data
  settings!: SettingsType;
  adoptions!: AdoptionType[];
  metricsDaily!: MetricDailyResponseType[];
  metricsWeekly!: MetricDailyResponseType[];
  surveysWeekly!: SurveyType[];
  surveysMonthly!: SurveyType[];
  
  // Flag to enable/disable calculation logging
  debugLogging: boolean = false;
  
  // Replace individual boolean flags with a Set to track logged calculation names
  private loggedCalculations: Set<string> = new Set();
  
  // Tracks calculation readiness
  dataFetched: boolean = false;
  
  // Collection of logs to return with the response
  calculationLogs: CalcLogType[] = [];
  
  /**
   * Log calculation details if debug logging is enabled
   * Each calculation name will only be logged once
   */
  private logCalculation(name: string, inputs: Record<string, unknown>, formula: string, result: unknown): void {
    // Only log if we haven't logged this calculation name before
    if (!this.loggedCalculations.has(name)) {
      // Mark this calculation name as logged
      this.loggedCalculations.add(name);
      
      const logEntry: CalcLogType = {
        name,
        inputs,
        formula,
        result
      };
      
      // Store the log entry if debug logging is enabled
      if (this.debugLogging) {
        this.calculationLogs.push(logEntry);
        
        // Also print to console
        console.log(`
========== CALCULATION: ${name} ==========
INPUTS:
${Object.entries(inputs).map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`).join('\n')}

FORMULA/ALGORITHM:
  ${formula}

RESULT:
  ${JSON.stringify(result)}
========================================
`);
      }
    }
  }

  // Reset the logged calculations set when starting a new calculation run
  private resetLogging(): void {
    this.loggedCalculations.clear();
    this.calculationLogs = [];
  }

  /**
   * Fetch and store all calculation data from services
   */
  async fetchCalculationData(org: string | null, referenceDate: Date = new Date()): Promise<void> {
    // Format date ranges
    const now = dayjs(referenceDate);
    const oneDayAgo = now.subtract(1, 'day').toDate();
    const sevenDaysAgo = now.subtract(7, 'days').toDate();
    const thirtyDaysAgo = now.subtract(30, 'days').toDate();

    // Create common params without org
    const baseMetricsParams: { since: string; until: string; org?: string } = {
      since: oneDayAgo.toISOString(),
      until: now.toISOString()
    };
    
    const weeklyMetricsParams: { since: string; until: string; org?: string } = {
      since: sevenDaysAgo.toISOString(),
      until: now.toISOString()
    };
    
    const weeklySurveysParams: { since: string; until: string; org?: string } = {
      since: sevenDaysAgo.toISOString(),
      until: now.toISOString()
    };
    
    const monthlySurveysParams: { since: string; until: string; org?: string } = {
      since: thirtyDaysAgo.toISOString(),
      until: now.toISOString()
    };
    
    // Add org parameter only if it's provided
    if (org) {
      baseMetricsParams.org = org;
      weeklyMetricsParams.org = org;
      weeklySurveysParams.org = org;
      monthlySurveysParams.org = org;
    }

    this.logCalculation(
      'Calculate Parameters',
      {
        baseMetricsParams: baseMetricsParams,
        weeklyMetricsParams: weeklyMetricsParams,
        monthlySurveysParams: monthlySurveysParams
      },
      'select the various metrics for last week and the last 30 days ago',
      {}  // Replace 'result' with empty object as it's not defined
    );
    // Fetch all required data in parallel
    [
      this.settings,
      this.adoptions,
      this.metricsDaily,
      this.metricsWeekly,
      this.surveysWeekly,
      this.surveysMonthly
    ] = await Promise.all([
      app.settingsService.getAllSettings(), // Use app-level settings service
      adoptionService.getAllAdoptions2({
        filter: { enterprise: 'enterprise' },
        projection: {}
      }),
      metricsService.getMetrics(baseMetricsParams),
      metricsService.getMetrics(weeklyMetricsParams),
      copilotSurveyService.getAllSurveys(weeklySurveysParams),
      copilotSurveyService.getAllSurveys(monthlySurveysParams)
    ]);
    
    this.dataFetched = true;
  }

  // === UTILITY CALCULATION METHODS ===
  
  /**
   * Calculate percentage with protection against division by zero
   */
  calculatePercentage(numerator: number, denominator: number): number {
    if (denominator === 0) {
      return 0;
    }
    // Correct calculation: (numerator / denominator) * 100
    return (numerator / denominator) * 100;
  }
  
  /**
   * Get distinct users from an array of surveys
   */
  getDistinctSurveyUsers(surveys: SurveyType[]): string[] {
    return [...new Set(surveys.map(survey => survey.userId))];
  }

  // === ORG-LEVEL CALCULATIONS ===
  
  /**
   * Calculate seats target value using adoption data and settings
   */
  calculateSeats(): Target {
    // Replicate existing logic from target.service.ts
    const topAdoptions = this.adoptions
      .sort((a, b) => b.totalActive - a.totalActive)
      .slice(0, 10);
      
    const totalSeats = topAdoptions.reduce((sum, adoption) => sum + adoption.totalSeats, 0);
    const avgTotalSeats = Math.round(totalSeats / (topAdoptions.length || 1));
    
    // Convert developerCount to number to ensure the correct type
    const developerCount = typeof this.settings.developerCount === 'string' 
      ? parseInt(this.settings.developerCount, 10) 
      : (this.settings.developerCount || 0);
    
    const result = {
      current: avgTotalSeats,
      target: avgTotalSeats,
      max: developerCount
    };
    
    this.logCalculation(
      'Calculate SEATS',
      {
        topAdoptions: topAdoptions.map(a => ({ totalSeats: a.totalSeats, totalActive: a.totalActive })),
        developerCount: this.settings.developerCount,
        adoptionsCount: this.adoptions.length
      },
      'Sort adoptions by totalActive, take top 10, average totalSeats, set current = target = avgTotalSeats, max = developerCount',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate adopted developers using adoption data
   */
  calculateAdoptedDevs(): Target {
    const topAdoptions = this.adoptions
      .sort((a, b) => b.totalActive - a.totalActive)
      .slice(0, 10);
      
    const totalActive = topAdoptions.reduce((sum, adoption) => sum + adoption.totalActive, 0);
    const avgTotalActive = Math.round(totalActive / (topAdoptions.length || 1));
    
    // Convert developerCount to number
    const developerCount = typeof this.settings.developerCount === 'string' 
      ? parseInt(this.settings.developerCount, 10) 
      : (this.settings.developerCount || 0);
    
    const result = {
      current: avgTotalActive,
      target: avgTotalActive,
      max: developerCount
    };
    
    this.logCalculation(
      'ADOPTED DEVS',
      {
        topAdoptions: topAdoptions.map(a => ({ totalActive: a.totalActive })),
        developerCount: this.settings.developerCount,
        adoptionsCount: this.adoptions.length
      },
      'Sort adoptions by totalActive, take top 10, average totalActive, set current = target = avgTotalActive, max = developerCount',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate monthly devs reporting time savings from survey data
   */
  calculateMonthlyDevsReportingTimeSavings(): Target {
    const distinctUsers = this.getDistinctSurveyUsers(this.surveysMonthly);
    
    // Convert developerCount to number
    const developerCount = typeof this.settings.developerCount === 'string' 
      ? parseInt(this.settings.developerCount, 10) 
      : (this.settings.developerCount || 0);
    
    const result = {
      current: distinctUsers.length,
      target: distinctUsers.length * 2, // Target is user-defined
      max: developerCount
    };
    
    this.logCalculation(
      'MONTHLY DEVS REPORTING TIME SAVINGS',
      {
        monthlySurveysCount: this.surveysMonthly.length,
        distinctUsersCount: distinctUsers.length,
        developerCount: this.settings.developerCount
      },
      'Count distinct userIds from monthly surveys, set current = distinctUsers.length, max = developerCount',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate percentage of seats reporting time savings
   */
  calculatePercentOfSeatsReportingTimeSavings(): Target {
    let seats = this.calculateSeats().current;
    let monthlyReporting = this.calculateMonthlyDevsReportingTimeSavings().current;
    const currentPercentage = this.calculatePercentage(monthlyReporting, seats);

    seats = this.calculateSeats().target;
    monthlyReporting = this.calculateMonthlyDevsReportingTimeSavings().target;
    const targetPercentage = this.calculatePercentage(monthlyReporting, seats);
    
    const result = {
      current: currentPercentage,
      target: targetPercentage, // Target can be user-defined
      max: 100
    };
    
    this.logCalculation(
      'PERCENTAGE OF SEATS REPORTING TIME SAVINGS',
      {
        monthlyReportingCount: monthlyReporting,
        seatsCount: seats
      },
      'Calculate (monthlyReporting / seats) * 100, set current = percentage, max = 100',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate percentage of seats adopted
   */
  calculatePercentOfSeatsAdopted(): Target {
    let seats = this.calculateSeats().current;
    let adoptedDevs = this.calculateAdoptedDevs().current;
    const currentPercentage = this.calculatePercentage(adoptedDevs, seats);

    seats = this.calculateSeats().target;
    adoptedDevs = this.calculateAdoptedDevs().target;
    const targetPercentage = this.calculatePercentage(adoptedDevs, seats);
    
    const result = {
      current: currentPercentage,
      target: targetPercentage, // Target is user-defined
      max: 100
    };
    
    this.logCalculation(
      'PERCENTAGE OF SEATS ADOPTED',
      {
        adoptedDevsCount: adoptedDevs,
        seatsCount: seats
      },
      'Calculate (adoptedDevs / seats) * 100, set current = percentage, max = 100',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate percentage of max possible seats adopted
   */
  calculatePercentOfMaxAdopted(): Target {
    // Convert maxSeats to number to ensure correct type
    const maxSeats = typeof this.settings.developerCount === 'string' 
      ? parseInt(this.settings.developerCount, 10) 
      : (this.settings.developerCount || 0);
    
    let adoptedDevs = this.calculateAdoptedDevs().current;
    const currentPercentage = this.calculatePercentage(adoptedDevs, maxSeats);
  
    adoptedDevs = this.calculateAdoptedDevs().target;
    const targetPercentage = this.calculatePercentage(adoptedDevs, maxSeats);
    
    const result = {
      current: currentPercentage,
      target: targetPercentage,
      max: 100
    };
    
    this.logCalculation(
      'PERCENTAGE OF MAX ADOPTED',
      {
        adoptedDevsCount: adoptedDevs,
        developerCount: maxSeats
      },
      'Calculate (adoptedDevs / developerCount) * 100, set current = currentPercentage, max = 100',
      result
    );
    
    return result;
  }

  // === USER-LEVEL CALCULATIONS ===
  
  /**
   * Calculate daily suggestions per developer
   */
  calculateDailySuggestions(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    
    // Extract metrics from the 5 largest values in the array, with fallbacks if there are less.
      
    const metricsWeekly = this.metricsWeekly.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const metricsAvg = metricsWeekly.reduce((acc, curr) => {
      acc.copilot_ide_code_completions.total_code_suggestions += curr.copilot_ide_code_completions?.total_code_suggestions || 0;
      return acc;
    }
    , { copilot_ide_code_completions: { total_code_suggestions: 0 } });
    metricsAvg.copilot_ide_code_completions.total_code_suggestions /= metricsWeekly.length || 1;
    const totalSuggestions = metricsAvg.copilot_ide_code_completions.total_code_suggestions || 0;
    const timestamp = metricsWeekly.length > 0 ? new Date(metricsWeekly[0].date).toISOString() : 'unknown';
    const rowCount = this.metricsWeekly?.length || 0;
    
    const suggestionsPerDev = adoptedDevs > 0 ? totalSuggestions / adoptedDevs : 0;
    
    const result = {
      current: suggestionsPerDev,
      target: suggestionsPerDev * 2, // Target is user-defined
      max: 150 // Based on frontend hardcoded value
    };
    
    this.logCalculation(
      'DAILY SUGGESTIONS PER DEVELOPER',
      {
        totalSuggestions: totalSuggestions,
        adoptedDevsCount: adoptedDevs,
        metricsRowCount: rowCount,
        timestamp: timestamp,
        metricsSource: 'metricsDaily[0].copilot_ide_code_completions.total_code_suggestions'
      },
      'Calculate totalSuggestions / adoptedDevs, set current = suggestionsPerDev, max = 150',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate daily chat turns per developer
   */
  calculateDailyChatTurns(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    
    // Extract metrics from the 5 most recent days in the array
    const metricsDaily = this.metricsDaily.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const metricsAvg = metricsDaily.reduce((acc, curr) => {
      acc.copilot_ide_chat.total_chats += curr.copilot_ide_chat?.total_chats || 0;
      acc.total_active_users += curr.total_active_users || 0;
      return acc;
    }, { copilot_ide_chat: { total_chats: 0 }, total_active_users: 0 });
    
    // Calculate averages
    metricsAvg.copilot_ide_chat.total_chats /= metricsDaily.length || 1;
    metricsAvg.total_active_users = Math.max(metricsAvg.total_active_users / (metricsDaily.length || 1), 1); // Avoid division by zero
    
    const totalChats = metricsAvg.copilot_ide_chat.total_chats;
    const activeUsers = metricsAvg.total_active_users;
    const timestamp = metricsDaily.length > 0 ? new Date(metricsDaily[0].date).toISOString() : 'unknown';
    const rowCount = metricsDaily.length;
    
    const chatTurnsPerDev = totalChats / activeUsers;
    
    const result = {
      current: chatTurnsPerDev,
      target: chatTurnsPerDev * 1.5, // Target is 50% increase
      max: 50 // Based on frontend hardcoded value
    };
    
    this.logCalculation(
      'DAILY CHAT TURNS PER DEVELOPER',
      {
        totalChats: totalChats,
        activeUsersCount: activeUsers, 
        metricsRowCount: rowCount,
        timestamp: timestamp,
        metricsSource: 'Average of top 5 recent daily metrics'
      },
      'Calculate average totalChats / activeUsers from 5 most recent days, set target = current * 1.5',
      result
    );
    
    return result;
  }

  /**
   * Calculate daily acceptances
   */
  calculateDailyAcceptances(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    
    // Extract metrics from the 5 most recent days in the array
    const metricsDaily = this.metricsDaily.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    // We don't have acceptance data yet, but when we do, we can follow this pattern
    // Placeholder formula: roughly 70% of suggestions get accepted
    const dailySuggestions = this.calculateDailySuggestions().current;
    const acceptanceRate = 0.7; // Placeholder assumption
    const acceptancesPerDev = dailySuggestions * acceptanceRate;
    
    const result = {
      current: acceptancesPerDev,
      target: acceptancesPerDev * 1.2, // Target is 20% increase
      max: 100
    };
    
    this.logCalculation(
      'DAILY ACCEPTANCES PER DEVELOPER',
      {
        dailySuggestions: dailySuggestions,
        assumedAcceptanceRate: acceptanceRate,
        adoptedDevsCount: adoptedDevs,
        metricsRowCount: metricsDaily.length
      },
      'Calculate dailySuggestions * assumedAcceptanceRate (placeholder until actual data available)',
      result
    );
    
    return result;
  }

  /**
   * Calculate daily dot com chats
   */
  calculateDailyDotComChats(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    
    // Extract metrics from the 5 most recent days in the array
    const metricsRecent = this.metricsWeekly.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    // Currently we may not have direct dot com chat data in metrics, so we'll look for it or use a calculation
    const metricsAvg = metricsRecent.reduce((acc, curr) => {
      // Check if we have direct dot com chat data (future-proofing)
      if (curr.copilot_dotcom_chat?.total_chats) {
        acc.dotcom_chats += curr.copilot_dotcom_chat.total_chats;
        acc.has_direct_data = true;
      } 
      return acc;
    }, { dotcom_chats: 0, has_direct_data: false });
    
    let dotComChatsPerDev = 0;
    
    if (metricsAvg.has_direct_data) {
      // If we have direct data, use it
      dotComChatsPerDev = adoptedDevs > 0 ? (metricsAvg.dotcom_chats / metricsRecent.length) / adoptedDevs : 0;
    } else {
      // Otherwise use our ratio estimation from IDE chat data
      const dailyChatTurns = this.calculateDailyChatTurns().current;
      const dotComChatRatio = 0.33; // Placeholder assumption
      dotComChatsPerDev = dailyChatTurns * dotComChatRatio;
    }
    
    const result = {
      current: dotComChatsPerDev,
      target: dotComChatsPerDev * 1.5, // Target is 50% increase
      max: 100
    };
    
    this.logCalculation(
      'DAILY DOTCOM CHATS PER DEVELOPER',
      {
        dotComChatsTotal: metricsAvg.dotcom_chats,
        hasDirectData: metricsAvg.has_direct_data,
        fallbackDailyChatTurns: !metricsAvg.has_direct_data ? this.calculateDailyChatTurns().current : null,
        assumedDotComRatio: !metricsAvg.has_direct_data ? 0.33 : null,
        adoptedDevsCount: adoptedDevs,
        metricsRowCount: metricsRecent.length,
        metricsTimeRange: metricsRecent.length > 0 ? 
          `${new Date(metricsRecent[metricsRecent.length-1].date).toISOString()} to ${new Date(metricsRecent[0].date).toISOString()}` : 'unknown'
      },
      metricsAvg.has_direct_data ? 
        'Average dotcom_chats / adoptedDevs from 5 most recent metrics days' : 
        'Calculate dailyChatTurns * assumedDotComRatio (using fallback ratio)',
      result
    );
    
    return result;
  }

  /**
   * Calculate weekly PR summaries per developer
   */
  calculateWeeklyPRSummaries(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    
    // Extract metrics from the last 5 metrics points in the array (up to a week)
    const metricsWeekly = this.metricsWeekly.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const metricsAvg = metricsWeekly.reduce((acc, curr) => {
      acc.copilot_dotcom_pull_requests.total_pr_summaries_created += 
        curr.copilot_dotcom_pull_requests?.total_pr_summaries_created || 0;
      return acc;
    }, { copilot_dotcom_pull_requests: { total_pr_summaries_created: 0 } });
    
    // Calculate average
    metricsAvg.copilot_dotcom_pull_requests.total_pr_summaries_created /= metricsWeekly.length || 1;
    
    const totalPRSummaries = metricsAvg.copilot_dotcom_pull_requests.total_pr_summaries_created;
    const timestamp = metricsWeekly.length > 0 ? new Date(metricsWeekly[0].date).toISOString() : 'unknown';
    const rowCount = metricsWeekly.length;
    
    const prSummariesPerDev = adoptedDevs > 0 ? totalPRSummaries / adoptedDevs : 0;
    
    const result = {
      current: prSummariesPerDev,
      target: prSummariesPerDev * 2, // Target is double current
      max: 5 // Based on frontend hardcoded value
    };
    
    this.logCalculation(
      'WEEKLY PR SUMMARIES PER DEVELOPER',
      {
        totalPRSummaries: totalPRSummaries,
        adoptedDevsCount: adoptedDevs,
        metricsRowCount: rowCount,
        timestamp: timestamp,
        metricsSource: 'Average of recent weekly metrics'
      },
      'Calculate average totalPRSummaries / adoptedDevs, set target = current * 2',
      result
    );
    
    return result;
  }

  /**
   * Calculate weekly time saved in hours per developer
   */
  calculateWeeklyTimeSavedHrs(): Target {
    // If no surveys, return default values
    if (this.surveysWeekly.length === 0) {
      return { current: 0, target: 0, max: 10 };
    }
    
    // Get distinct users who submitted surveys
    const distinctUsers = this.getDistinctSurveyUsers(this.surveysWeekly);
    if (distinctUsers.length === 0) {
      return { current: 0, target: 0, max: 10 };
    }
    
    // Group surveys by user to get average time saved per user
    const userTimeSavings = distinctUsers.map(userId => {
      const userSurveys = this.surveysWeekly.filter(survey => survey.userId === userId);
      const totalPercent = userSurveys.reduce((sum, survey) => {
        const percentTimeSaved = typeof survey.percentTimeSaved === 'number' ? survey.percentTimeSaved : 0;
        return sum + percentTimeSaved;
      }, 0);
      return totalPercent / userSurveys.length; // Average percent time saved per user
    });
    
    // Average across all users
    const avgPercentTimeSaved = userTimeSavings.reduce((sum, percent) => sum + percent, 0) / userTimeSavings.length;
    
    // Convert settings values to numbers
    const hoursPerYear = typeof this.settings.hoursPerYear === 'number' ? this.settings.hoursPerYear : 2000;
    const percentCoding = typeof this.settings.percentCoding === 'number' ? this.settings.percentCoding : 50;
    
    // Calculate weekly hours saved based on settings and average percent
    const weeklyHours = hoursPerYear / 50; // Assuming 50 working weeks
    const weeklyDevHours = weeklyHours * (percentCoding / 100);
    const avgWeeklyTimeSaved = weeklyDevHours * (avgPercentTimeSaved / 100);
    
    // Calculate max based on settings
    const maxPercentTimeSaved = typeof this.settings.percentTimeSaved === 'number' ? this.settings.percentTimeSaved : 20;
    const maxWeeklyTimeSaved = weeklyDevHours * (maxPercentTimeSaved / 100);
    
    const result = {
      current: avgWeeklyTimeSaved,
      target: Math.min(avgWeeklyTimeSaved * 1.5, maxWeeklyTimeSaved * 0.8), // Target is 50% increase, capped at 80% of max
      max: maxWeeklyTimeSaved || 10 // Provide a fallback
    };
    
    this.logCalculation(
      'WEEKLY TIME SAVED HRS PER DEVELOPER',
      {
        distinctUsersCount: distinctUsers.length,
        surveysCount: this.surveysWeekly.length,
        avgPercentTimeSaved: avgPercentTimeSaved,
        userPercentages: userTimeSavings,
        hoursPerYear: hoursPerYear,
        percentCoding: percentCoding,
        weeklyDevHours: weeklyDevHours
      },
      'Calculate average time saved percentage per user, then weeklyDevHours * (avgPercentTimeSaved / 100)',
      result
    );
    
    return result;
  }

  // === IMPACT-LEVEL CALCULATIONS ===
  
  /**
   * Calculate monthly time savings in hours
   */
  calculateMonthlyTimeSavingsHrs(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    const weeklyTimeSavedHrs = this.calculateWeeklyTimeSavedHrs().current;
    const monthlyTimeSavings = adoptedDevs * weeklyTimeSavedHrs * 4; // Assuming 4 weeks per month
    
    const result = {
      current: monthlyTimeSavings,
      target: 0, // Target is user-defined
      max: 80 * this.calculateSeats().current // Based on target.service.ts
    };
    
    this.logCalculation(
      'MONTHLY TIME SAVINGS HRS',
      {
        adoptedDevsCount: adoptedDevs,
        weeklyTimeSavedHrs: weeklyTimeSavedHrs,
        seatsCount: this.calculateSeats().current
      },
      'Calculate adoptedDevs * weeklyTimeSavedHrs * 4, set current = monthlyTimeSavings, max = 80 * seats',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate annual time savings in dollars
   */
  calculateAnnualTimeSavingsAsDollars(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    const weeklyTimeSavedHrs = this.calculateWeeklyTimeSavedHrs().current;
    
    // Ensure all values are properly typed as numbers
    const hoursPerYear = typeof this.settings.hoursPerYear === 'number' ? this.settings.hoursPerYear : 2000;
    const weeksInYear = Math.round(hoursPerYear / 40) || 50; // Calculate weeks and ensure it's a number
    
    const devCostPerYear = typeof this.settings.devCostPerYear === 'number' ? this.settings.devCostPerYear : 0;
    const hourlyRate = devCostPerYear > 0 ? (devCostPerYear / hoursPerYear) : 50;
    
    const annualSavings = weeklyTimeSavedHrs * weeksInYear * hourlyRate * adoptedDevs;
    
    const result = {
      current: annualSavings || 0, // Ensure non-null
      target: 0,
      max: 12 * this.calculateSeats().current * weeksInYear * hourlyRate || 10000 // Provide fallback
    };
    
    this.logCalculation(
      'ANNUAL TIME SAVINGS AS DOLLARS',
      {
        adoptedDevsCount: adoptedDevs,
        weeklyTimeSavedHrs: weeklyTimeSavedHrs,
        weeksInYear: weeksInYear,
        hourlyRate: hourlyRate,
        seatsCount: this.calculateSeats().current
      },
      'Calculate weeklyTimeSavedHrs * weeksInYear * hourlyRate * adoptedDevs, set current = annualSavings, max = 80 * seats * 50',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate productivity or throughput boost percentage
   */
  calculateProductivityOrThroughputBoostPercent(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    const weeklyTimeSavedHrs = this.calculateWeeklyTimeSavedHrs().current;
    const monthlyTimeSavings = adoptedDevs * weeklyTimeSavedHrs * 4; // Assuming 4 weeks per month
    
    // Convert hours per year to number
    const hoursPerYear = typeof this.settings.hoursPerYear === 'number' ? this.settings.hoursPerYear : 2000;
    const hoursPerWeek = hoursPerYear / 50 || 40; // Default to 40 if undefined
    
    // Calculate productivity boost factor (not percentage)
    const productivityBoost = (hoursPerWeek + weeklyTimeSavedHrs) / hoursPerWeek;
  
    const result = {
      current: productivityBoost,
      target: 10, // Target is user-defined
      max: 25 // Based on target.service.ts
    };
    
    this.logCalculation(
      'PRODUCTIVITY OR THROUGHPUT BOOST PERCENT',
      {
        adoptedDevsCount: adoptedDevs,                  
        weeklyTimeSavedHrs: weeklyTimeSavedHrs,
        monthlyTimeSavings: monthlyTimeSavings,
        hoursPerWeek: hoursPerWeek,
        productivityBoost: productivityBoost
      },
      'Calculate (hoursPerWeek + weeklyTimeSavedHrs) / hoursPerWeek, set current = productivityBoost, max = 25',
      result
    );
    
    return result;
  }

  /**
   * Calculate all targets based on fetched data
   */
  calculateAllTargets(): Targets {
    if (!this.dataFetched) {
      throw new Error('Data must be fetched before calculations can be performed');
    }
    
    const result = {
      org: {
        seats: this.calculateSeats(),
        adoptedDevs: this.calculateAdoptedDevs(),
        monthlyDevsReportingTimeSavings: this.calculateMonthlyDevsReportingTimeSavings(),
        percentOfSeatsReportingTimeSavings: this.calculatePercentOfSeatsReportingTimeSavings(),
        percentOfSeatsAdopted: this.calculatePercentOfSeatsAdopted(),
        percentOfMaxAdopted: this.calculatePercentOfMaxAdopted(),
      },
      user: {
        dailySuggestions: this.calculateDailySuggestions(),
        dailyAcceptances: this.calculateDailyAcceptances(),
        dailyChatTurns: this.calculateDailyChatTurns(),
        dailyDotComChats: this.calculateDailyDotComChats(),
        weeklyPRSummaries: this.calculateWeeklyPRSummaries(),
        weeklyTimeSavedHrs: this.calculateWeeklyTimeSavedHrs(),
      },
      impact: {
        monthlyTimeSavingsHrs: this.calculateMonthlyTimeSavingsHrs(),
        annualTimeSavingsAsDollars: this.calculateAnnualTimeSavingsAsDollars(),
        productivityOrThroughputBoostPercent: this.calculateProductivityOrThroughputBoostPercent(),
      }
    };
    
    // Sanitize the result to ensure no null values
    return this.sanitizeTargets(result);
  }

  /**
   * Ensure no null values in the targets object
   */
  private sanitizeTargets(targets: Targets): Targets {
    // Helper function to sanitize a single Target object
    const sanitizeTarget = (target: Target): Target => {
      return {
        current: target.current === null ? 0 : target.current,
        target: target.target === null ? 0 : target.target,
        max: target.max === null ? 0 : target.max
      };
    };
    
    // Process each section of the targets object
    ['org', 'user', 'impact'].forEach(section => {
      Object.keys(targets[section]).forEach(key => {
        targets[section][key] = sanitizeTarget(targets[section][key]);
      });
    });
    
    return targets;
  }

  /**
   * One-step method to fetch data and perform all calculations
   * The instance method - used when you already have a service instance
   */
  async fetchAndCalculateTargets(
    org: string | null, 
    enableLogging: boolean = false,
    includeLogsInResponse: boolean = false
  ): Promise<{ targets: Targets; logs?: CalcLogType[] }> {
    this.debugLogging = enableLogging;
    this.resetLogging(); // Reset logging state
    console.log(`Calculation logging ${enableLogging ? 'enabled' : 'disabled'}`);
    
    await this.fetchCalculationData(org);
    const targets = this.calculateAllTargets();
    
    // Return both targets and logs if requested
    if (includeLogsInResponse && this.debugLogging) {
      return { 
        targets,
        logs: this.calculationLogs
      };
    }
    
    return { targets };
  }

  /**
   * Static method to create an instance and calculate targets in one step
   * Used for convenience when you don't want to create an instance first
   * This is a facade that creates an instance and calls the instance method
   */
  static async fetchAndCalculateTargets(
    org: string | null, 
    enableLogging: boolean = false,
    includeLogsInResponse: boolean = false
  ): Promise<{ targets: Targets; logs?: CalcLogType[] }> {
    const service = new TargetCalculationService();
    return service.fetchAndCalculateTargets(org, enableLogging, includeLogsInResponse);
  }
}

// Allow isolated testing
if (import.meta.url.endsWith(process.argv[1])) {
  (async () => {
    // Example of using the static method with logs included in response
    const result = await TargetCalculationService.fetchAndCalculateTargets('test-org', true, true);
    console.log('Calculated Targets:', JSON.stringify(result.targets, null, 2));
    console.log(`Returned ${result.logs?.length || 0} calculation logs`);
  })();
}
