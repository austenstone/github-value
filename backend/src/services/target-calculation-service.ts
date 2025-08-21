import { SettingsType } from './settings.service.js';
import adoptionService, { AdoptionType } from './adoption.service.js';
import metricsService from './metrics.service.js';
import { MetricDailyResponseType } from "../models/metrics.model.js";
import copilotSurveyService from './survey.service.js';
import { SurveyType } from './survey.service.js'; // Import from survey.service.js instead
import app from '../index.js';
import dayjs from 'dayjs';
import util from 'util';
import logger from './logger.js';

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
        
        // Also pretty print to console
        logger.info(`
========== CALCULATION: ${name} ==========
INPUTS:
${util.inspect(inputs, { depth: null, colors: false, compact: false })}

FORMULA/ALGORITHM:
  ${formula}

RESULT:
  ${util.inspect(result, { depth: null, colors: false, compact: false })}
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
        filter: { 
          // Only set enterprise if no org is provided
          ...(org ? { org } : { enterprise: 'enterprise' }),
          // Only get adoption data from the last 7 days
          date: {
            $gte: sevenDaysAgo,
            $lte: now.toDate()
          },
        },
        projection: {
          // Only select fields needed for calculations
          totalSeats: 1,
          totalActive: 1,
          totalInactive: 1,
          date: 1,
          org: 1,
          enterprise: 1
        }
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
   * Round a number to a specified number of decimal places
   * @param value The number to round
   * @param decimals The number of decimal places (default: 1)
   */
  private roundToDecimal(value: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  /**
   * Calculate percentage with protection against division by zero
   */
  calculatePercentage(numerator: number, denominator: number): number {
    if (denominator === 0) {
      return 0;
    }
    // Calculate and round to one decimal place
    return this.roundToDecimal((numerator / denominator) * 100);
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
        topAdoptions: topAdoptions.map(a => ({ totalSeats: a.totalSeats, totalActive: a.totalActive })),
        totalActive: totalActive,
        avgTotalActive: avgTotalActive,
        developerCount: this.settings.developerCount,
        adoptionsRecordCount: this.adoptions.length
      },
      'Get total active developers from top 10 orgs, calculate average (totalActive / topAdoptions.length), set current = target = avgTotalActive, max = developerCount',
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
        developerCount: this.settings.developerCount,
        timeRange: '30 days'
      },
      'Count distinct userIds from monthly surveys (last 30 days), set current = distinctUsers.length, target = current * 2, max = developerCount',
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
   * Calculate daily suggestions, accepts, chats, etc. per developer
   */
  calculateDailyMetrics(): {
    suggestions: Target;
    chats: Target;
    acceptances: Target;
    dotcomChats: Target;
    prSummaries: Target;
  } {
    // Extract metrics from the 5 most recent days in the array
    let suggestionsPerDev = 0;
    let chatsPerDev = 0;
    let dotcomChatsPerDev = 0;
    let prSummariesPerDev = 0;
    const acceptanceRate = 0.7; // Placeholder assumption for acceptance rate
    
    const metricsWeekly = this.metricsWeekly
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // --- NEW DEBUG LOG ----------------------------------------------------
    this.logCalculation(
      'METRICS WEEKLY DATA',
      {
        // capture only the most relevant fields for quick inspection
        metricsWeekly: metricsWeekly.map(m => ({
          date: m.date,
          total_active_users: m.total_active_users,
          total_engaged_users: m.total_engaged_users,
          total_code_suggestions: m.copilot_ide_code_completions?.total_code_suggestions ?? 0,
          total_chats: m.copilot_ide_chat?.total_chats ?? 0,
          dotcom_total_chats: m.copilot_dotcom_chat?.total_chats ?? 0,
          pr_summaries_created: m.copilot_dotcom_pull_requests?.total_pr_summaries_created ?? 0
        }))
      },
      'Sort metrics by date descending and take the 5 most recent entries.',
      metricsWeekly.length   // result: number of entries logged 
    );
    // ----------------------------------------------------------------------
    
    // Count how many metrics entries had valid data
    let validSuggestionsCount = 0;
    let validChatsCount = 0;
    let validDotcomChatsCount = 0;
    let validPrSummariesCount = 0;
    
    // Calculate average directly into per-developer metrics
    metricsWeekly.forEach(curr => {
      // Process code suggestions data
      if (curr.copilot_ide_code_completions &&
          curr.copilot_ide_code_completions.total_code_suggestions > 0 &&
          curr.copilot_ide_code_completions.total_engaged_users > 0) {
        suggestionsPerDev +=
          curr.copilot_ide_code_completions.total_code_suggestions /
          curr.copilot_ide_code_completions.total_engaged_users;
        validSuggestionsCount++;
      }

      // Process IDE chat data
      const ideChat = curr.copilot_ide_chat;
      if (ideChat && ideChat.total_chats > 0 && curr.total_active_users > 0) {
        chatsPerDev += ideChat.total_chats / curr.total_active_users;
        validChatsCount++;
      }

      // Process dot-com chat data
      const dotcomChat = curr.copilot_dotcom_chat;
      if (dotcomChat && dotcomChat.total_chats > 0 && curr.total_active_users > 0) {
        dotcomChatsPerDev += dotcomChat.total_chats / curr.total_active_users;
        validDotcomChatsCount++;
      }

      // Process PR summaries data
      const prSummaries = curr.copilot_dotcom_pull_requests;
      if (prSummaries && prSummaries.total_pr_summaries_created > 0 && curr.total_active_users > 0) {
        prSummariesPerDev += prSummaries.total_pr_summaries_created / curr.total_active_users;
        validPrSummariesCount++;
      }
    });
    
    // Calculate the averages by dividing by the number of valid days found
    if (validSuggestionsCount > 0) {
      suggestionsPerDev /= validSuggestionsCount;
    }
    
    if (validChatsCount > 0) {
      chatsPerDev /= validChatsCount;
    }
    
    if (validDotcomChatsCount > 0) {
      dotcomChatsPerDev /= validDotcomChatsCount;
    } else {
      // Fallback to ratio estimation if no direct data
      dotcomChatsPerDev = chatsPerDev * 0.33; // Placeholder assumption
    }
    
    if (validPrSummariesCount > 0) {
      prSummariesPerDev /= validPrSummariesCount;
    }
    
    // Calculate acceptance rate (placeholder until real data)
    const acceptancesPerDev = suggestionsPerDev * acceptanceRate;
    
    const timestamp = metricsWeekly.length > 0 ? new Date(metricsWeekly[0].date).toISOString() : 'unknown';
    
    // Create results for each metric
    const suggestionsResult = {
      current: this.roundToDecimal(suggestionsPerDev),
      target: 100,
      max: 150 // Based on frontend hardcoded value
    };
    
    const chatsResult = {
      current: this.roundToDecimal(chatsPerDev),
      target: 30, 
      max: 60 // Based on frontend hardcoded value
    };
    
    const acceptancesResult = {
      current: this.roundToDecimal(acceptancesPerDev),
      target: 35, 
      max: 100
    };
    
    const dotcomChatsResult = {
      current: this.roundToDecimal(dotcomChatsPerDev),
      target: this.roundToDecimal(dotcomChatsPerDev) * 1.25, // Target is 25% higher
      max: 100
    };
    
    const prSummariesResult = {
      current: this.roundToDecimal(prSummariesPerDev),
      target: this.roundToDecimal(prSummariesPerDev * 1.5), // Target is 50% higher
      max: 5 // Based on frontend hardcoded value
    };
    
    // Log the calculations
    this.logCalculation(
      'DAILY SUGGESTIONS PER DEVELOPER',
      {
        validMetricsCount: validSuggestionsCount,
        metricsDataPoints: metricsWeekly.length,
        avgSuggestionsPerDay: suggestionsPerDev,
        timestamp: timestamp
      },
      'Sort metrics by date, take 5 most recent, calculate average daily suggestions per developer',
      suggestionsResult
    );
    
    this.logCalculation(
      'DAILY CHAT TURNS PER DEVELOPER',
      {
        validMetricsCount: validChatsCount,
        metricsDataPoints: metricsWeekly.length,
        avgChatsPerDay: chatsPerDev,
        timestamp: timestamp
      },
      'Calculate average totalChats / activeUsers from 5 most recent days',
      chatsResult
    );
    
    this.logCalculation(
      'DAILY ACCEPTANCES PER DEVELOPER',
      {
        dailySuggestions: suggestionsPerDev,
        assumedAcceptanceRate: acceptanceRate,
        timestamp: timestamp
      },
      'Calculate dailySuggestions * assumedAcceptanceRate (placeholder until actual data available)',
      acceptancesResult
    );
    
    this.logCalculation(
      'DAILY DOTCOM CHATS PER DEVELOPER',
      {
        validMetricsCount: validDotcomChatsCount,
        hasDirectData: validDotcomChatsCount > 0,
        fallbackChatsPerDev: validDotcomChatsCount === 0 ? chatsPerDev : null,
        assumedDotComRatio: validDotcomChatsCount === 0 ? 0.33 : null,
        timestamp: timestamp
      },
      validDotcomChatsCount > 0 ? 
        'Calculate average dotcomChats / activeUsers from 5 most recent days' : 
        'Calculate chatsPerDev * assumedDotComRatio (using fallback ratio)',
      dotcomChatsResult
    );
    
    this.logCalculation(
      'WEEKLY PR SUMMARIES PER DEVELOPER',
      {
        validMetricsCount: validPrSummariesCount,
        metricsDataPoints: metricsWeekly.length,
        avgPrSummariesPerDev: prSummariesPerDev,
        timestamp: timestamp
      },
      'Calculate average prSummaries / activeUsers from 5 most recent days',
      prSummariesResult
    );
    
    return {
      suggestions: suggestionsResult,
      chats: chatsResult,
      acceptances: acceptancesResult,
      dotcomChats: dotcomChatsResult,
      prSummaries: prSummariesResult
    };
  }
  
  /**
   * Calculate daily suggestions per developer
   */
  calculateDailySuggestions(): Target {
    return this.calculateDailyMetrics().suggestions;
  }
  
  /**
   * Calculate daily chat turns per developer
   */
  calculateDailyChatTurns(): Target {
    return this.calculateDailyMetrics().chats;
  }
  
  /**
   * Calculate daily acceptances
   */
  calculateDailyAcceptances(): Target {
    return this.calculateDailyMetrics().acceptances;
  }

  /**
   * Calculate daily dot com chats
   */
  calculateDailyDotComChats(): Target {
    return this.calculateDailyMetrics().dotcomChats;
  }

  /**
   * Calculate weekly PR summaries per developer
   */
  calculateWeeklyPRSummaries(): Target {
    return this.calculateDailyMetrics().prSummaries;
  }

  /**
   * Calculate weekly time saved in hours per developer
   */
  calculateWeeklyTimeSavedHrs(): Target {
    // If no surveys, return default values with 2 hrs current
    if (this.surveysWeekly.length === 0) {
      return { current: 2, target: 2, max: 10 };
    }
    
    // Get distinct users who submitted surveys
    const distinctUsers = this.getDistinctSurveyUsers(this.surveysWeekly);
    if (distinctUsers.length === 0) {
      return { current: 2, target: 2, max: 10 };
    }
    
    // Group surveys by user to get average time saved per user
    const userTimeSavings = distinctUsers.map(userId => {
      const userSurveys = this.surveysWeekly.filter(survey => survey.userId === userId);
      const totalPercent = userSurveys.reduce((sum, survey) => {
        // Always parse percentTimeSaved as float
        const percentTimeSaved = survey.percentTimeSaved != null ? parseFloat(survey.percentTimeSaved as any) : 0;
        return sum + percentTimeSaved;
      }, 0);
      return totalPercent / userSurveys.length; // Average percent time saved per user
    });
    
    // Average across all users
    const avgPercentTimeSaved = userTimeSavings.reduce((sum, percent) => sum + percent, 0) / userTimeSavings.length;
    
    // Convert settings values to numbers (parse from string if needed)
    const hoursPerYear = this.settings.hoursPerYear != null ? parseFloat(this.settings.hoursPerYear as any) : 2000;
    const percentCoding = this.settings.percentCoding != null ? parseFloat(this.settings.percentCoding as any) : 50;
    
    // Calculate weekly hours saved based on settings and average percent
    const weeklyHours = hoursPerYear / 50; // Assuming 50 working weeks
    const weeklyDevHours = weeklyHours * (percentCoding / 100);
    const avgWeeklyTimeSaved = weeklyDevHours * (avgPercentTimeSaved / 100);
    
    // Calculate max based on settings
    const maxPercentTimeSaved = this.settings.percentTimeSaved != null ? parseFloat(this.settings.percentTimeSaved as any) : 20;
    const maxWeeklyTimeSaved = weeklyDevHours * (maxPercentTimeSaved / 100);
    
    // Use default value of 2 if calculated value is 0 or very small
    const currentValue = avgWeeklyTimeSaved < 0.1 ? 2 : this.roundToDecimal(avgWeeklyTimeSaved);
    const targetValue = avgWeeklyTimeSaved < 0.1 ? 3 : this.roundToDecimal(Math.min(avgWeeklyTimeSaved * 1.5, maxWeeklyTimeSaved * 0.8));
    
    const result = {
      current: currentValue,
      target: targetValue, // Target is 50% increase, capped at 80% of max
      max: this.roundToDecimal(maxWeeklyTimeSaved || 10) // Provide a fallback
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
        weeklyDevHours: weeklyDevHours,
        calculatedWeeklyTimeSaved: avgWeeklyTimeSaved,
        usedDefaultValue: avgWeeklyTimeSaved < 0.1
      },
      'Calculate average time saved percentage per user, then weeklyDevHours * (avgPercentTimeSaved / 100), use default value of 2 if result is < 0.1',
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
      current: this.roundToDecimal(monthlyTimeSavings),
      target: 0, // Target is user-defined
      max: this.roundToDecimal(80 * this.calculateSeats().current) // Based on target.service.ts
    };
    
    this.logCalculation(
      'MONTHLY TIME SAVINGS HRS',
      {
        adoptedDevsCount: adoptedDevs,
        weeklyTimeSavedHrs: weeklyTimeSavedHrs,
        monthlyCalculation: `${adoptedDevs} * ${weeklyTimeSavedHrs} * 4 = ${monthlyTimeSavings}`,
        calculatedMonthlyTimeSavings: monthlyTimeSavings,
        seatsCount: this.calculateSeats().current
      },
      'Calculate adoptedDevs * weeklyTimeSavedHrs * 4 (weeklyTimeSavedHrs already includes default of 2 if needed), max = 80 * seats',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate annual time savings in dollars
   */
  calculateAnnualTimeSavingsAsDollars(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    const weeklyTimeSavedHrs = this.calculateWeeklyTimeSavedHrs().current; // This now includes default of 2 if needed
    
    // Always parse settings values as numbers (from string if needed)
    const hoursPerYear = this.settings.hoursPerYear != null ? parseFloat(this.settings.hoursPerYear as any) : 2000;
    const weeksInYear = Math.round(hoursPerYear / 40) || 50; // Calculate weeks and ensure it's a number
    
    const devCostPerYear = this.settings.devCostPerYear != null ? parseFloat(this.settings.devCostPerYear as any) : 0;
    const hourlyRate = devCostPerYear > 0 ? (devCostPerYear / hoursPerYear) : 50;
    
    const annualSavings = weeklyTimeSavedHrs * weeksInYear * hourlyRate * adoptedDevs;
    
    // For dollar values, we can use 0 decimals (whole dollars)
    const result = {
      current: Math.round(annualSavings || 0), // Round to whole dollars
      target: 0,
      max: Math.round(weeksInYear * this.calculateSeats().current * hourlyRate * 40 || 10000) // Max assumes 40 hours per week saved per seat
    };
    
    this.logCalculation(
      'ANNUAL TIME SAVINGS AS DOLLARS',
      {
        adoptedDevsCount: adoptedDevs,
        weeklyTimeSavedHrs: weeklyTimeSavedHrs,
        weeksInYear: weeksInYear,
        hourlyRate: hourlyRate,
        annualSavingsCalculation: `${weeklyTimeSavedHrs} * ${weeksInYear} * ${hourlyRate} * ${adoptedDevs} = ${annualSavings}`,
        seatsCount: this.calculateSeats().current
      },
      'Calculate weeklyTimeSavedHrs * weeksInYear * hourlyRate * adoptedDevs (weeklyTimeSavedHrs includes default of 2 if needed)',
      result
    );
    
    return result;
  }
  
  /**
   * Calculate productivity or throughput boost percentage
   */
  calculateProductivityOrThroughputBoostPercent(): Target {
    const adoptedDevs = this.calculateAdoptedDevs().current;
    const weeklyTimeSavedHrs = this.calculateWeeklyTimeSavedHrs().current; // This now includes default of 2 if needed
    
    // Always parse hours per year as number
    const hoursPerYear = this.settings.hoursPerYear != null ? parseFloat(this.settings.hoursPerYear as any) : 2000;
    const hoursPerWeek = hoursPerYear / 50 || 40; // Default to 40 if undefined
    
    // Calculate productivity boost factor (not percentage)
    const productivityBoost = (hoursPerWeek + weeklyTimeSavedHrs) / hoursPerWeek;
    
    // Convert to percentage increase (e.g., 1.2 becomes 20%)
    const productivityBoostPercent = (productivityBoost - 1) * 100;
  
    const result = {
      current: this.roundToDecimal(productivityBoostPercent),
      target: this.roundToDecimal(Math.min(productivityBoostPercent * 1.5, 20)), // Target is 50% higher, capped at 20%
      max: 25 // Based on target.service.ts
    };
    
    this.logCalculation(
      'PRODUCTIVITY OR THROUGHPUT BOOST PERCENT',
      {
        adoptedDevsCount: adoptedDevs,
        weeklyTimeSavedHrs: weeklyTimeSavedHrs,
        hoursPerWeek: hoursPerWeek,
        productivityBoostFactor: productivityBoost,
        productivityBoostPercent: productivityBoostPercent
      },
      'Calculate boost factor as (hoursPerWeek + weeklyTimeSavedHrs) / hoursPerWeek, then convert to percentage by (factor - 1) * 100 (weeklyTimeSavedHrs includes default of 2 if needed)',
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
    logger.info(`Calculation logging ${enableLogging ? 'enabled' : 'disabled'}`);
    
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
    logger.info('Static method received params:', {
      org: org || 'null',
      enableLogging, 
      includeLogsInResponse
    });
    
    const service = new TargetCalculationService();
    
    // Explicitly pass all parameters to ensure they're not overwritten
    const result = await service.fetchAndCalculateTargets(
      org, 
      enableLogging, 
      includeLogsInResponse
    );
    
    // Verify the structure of the result before returning
    const hasLogs = Boolean(result.logs && result.logs.length > 0);
    logger.info(`Result has logs: ${hasLogs}, includeLogsInResponse: ${includeLogsInResponse}`);
    
    return result;
  }
}

// Allow isolated testing
//to execute this module directly, use the command:
// node --loader ts-node/esm backend/src/services/target-calculation-service.ts
if (import.meta.url.endsWith(process.argv[1])) {
  (async () => {
    // Example of using the static method with logs included in response
    const result = await TargetCalculationService.fetchAndCalculateTargets('test-org', true, true);
    logger.info('Calculated Targets:', JSON.stringify(result.targets, null, 2));
    logger.info(`Returned ${result.logs?.length || 0} calculation logs`);
  })();
}