import mongoose from 'mongoose';
import { AdoptionType } from './adoption.service.js'
import { SettingsType } from './settings.service.js';
import { TargetCalculationService } from './target-calculation-service.js';
import logger from './logger.js';

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
}

class TargetValuesService {
  async getTargetValues(org?: string) {
    try {
      const Targets = mongoose.model('Targets');
      const scope = org || "1"; // Default to enterprise-wide if no org specified
      logger.info(`Getting target values for scope: ${scope} ${org ? '(org-specific)' : '(enterprise-wide)'}`);
      
      // Look for scope-specific targets
      let targets = await Targets.findOne({ orgOrEnterprise: scope });
      
      if (targets) {
        logger.info(`Found existing targets for scope: ${scope}`);
        return targets;
      }
      
      logger.info(`No targets found for scope: ${scope}`);
      
      // If looking for org-specific targets but none exist, check if enterprise targets exist to copy
      if (org && org !== "1") {
        logger.info(`Looking for enterprise targets to copy for org: ${org}`);
        const enterpriseTargets = await Targets.findOne({ orgOrEnterprise: "1" });
        
        if (enterpriseTargets) {
          logger.info(`Found enterprise targets, creating org-specific copy for: ${org}`);
          // Copy enterprise targets to create org-specific targets
          const orgTargets = { ...enterpriseTargets.toObject() };
          delete orgTargets._id; // Remove the _id so MongoDB creates a new one
          delete orgTargets.createdAt; // Remove timestamps so they get regenerated
          delete orgTargets.updatedAt;
          orgTargets.orgOrEnterprise = org;
          
          targets = await Targets.create(orgTargets);
          logger.info(`Successfully created org-specific targets for: ${org}`);
          return targets;
        } else {
          logger.warn(`No enterprise targets found to copy for org: ${org}`);
        }
      }
      
      // If we get here, no targets exist for the requested scope
      if (!org || org === "1") {
        // This is a request for enterprise targets but none exist - this shouldn't happen after initialization
        logger.error('No enterprise targets found - this indicates an initialization problem');
      }
      
      return null;
    } catch (error) {
      const scope = org || "1";
      logger.error(`Error in getTargetValues for scope "${scope}":`, error);
      throw new Error(`Error fetching target values: ${error}`);
    }
  }

  async updateTargetValues(data: Targets, org?: string) {
    try {
      const Targets = mongoose.model('Targets');
      const scope = org || "1"; // Default to enterprise-wide if no org specified
      logger.info(`Updating target values for scope: ${scope} ${org ? '(org-specific)' : '(enterprise-wide)'}`);
      
      const targets = await Targets.findOneAndUpdate(
        { orgOrEnterprise: scope }, 
        { $set: { ...data, orgOrEnterprise: scope } }, 
        { new: true, upsert: true }
      );
      
      logger.info(`Successfully updated targets for scope: ${scope}`);
      return targets;
    } catch (error) {
      const scope = org || "1";
      logger.error(`Error updating target values for scope "${scope}":`, error);
      throw new Error(`Error updating target values: ${error}`);
    }
  }

  //TODO: remove this method
  // This method is not used in the current codebase and should be removed
  // It was originally intended to calculate targets based on settings and adoptions
  // but is now replaced by the fetchAndCalculateTargets method in TargetCalculationService
  // and should be removed to avoid confusion.
  calculateTargets_ori(settings: SettingsType, adoptions: AdoptionType[]): Targets {
    const topAdoptions = adoptions
      .sort((a, b) => b.totalActive - a.totalActive)
      .slice(0, 10);

    const averages = topAdoptions.reduce((acc, curr) => {
      return {
        totalSeats: acc.totalSeats + curr.totalSeats,
        totalActive: acc.totalActive + curr.totalActive,
        totalInactive: acc.totalInactive + curr.totalInactive
      };
    }, { totalSeats: 0, totalActive: 0, totalInactive: 0 });

    const avgTotalSeats = Math.round(averages.totalSeats / topAdoptions.length) || 0;
    const avgTotalActive = Math.round(averages.totalActive / topAdoptions.length) || 0;

    return {
      org: {
        seats: { current: avgTotalSeats, target: avgTotalSeats, max: avgTotalSeats },
        adoptedDevs: { current: avgTotalActive, target: avgTotalActive, max: avgTotalSeats },
        monthlyDevsReportingTimeSavings: { current: 0, target: 0, max: avgTotalSeats },
        percentOfSeatsReportingTimeSavings: { current: 0, target: 0, max: 100 },
        percentOfSeatsAdopted: {
          current: avgTotalActive ? Math.round((avgTotalActive / avgTotalSeats) * 100) : 0,
          target: avgTotalSeats ? Math.round((avgTotalActive / avgTotalSeats) * 100) : 0,
          max: 100
        },
        percentOfMaxAdopted: { current: 0, target: 0, max: 100 },
      },
      user: {
        dailySuggestions: { current: 0, target: 0, max: 100 },
        dailyAcceptances: { current: 0, target: 0, max: 100 },
        dailyChatTurns: { current: 0, target: 0, max: 100 },
        dailyDotComChats: { current: 0, target: 0, max: 100 },
        weeklyPRSummaries: { current: 0, target: 0, max: 100 },
        weeklyTimeSavedHrs: { current: 0, target: 0, max: 100 },
      },
      impact: {
        monthlyTimeSavingsHrs: { current: 0, target: 0, max: 80 * avgTotalSeats },
        annualTimeSavingsAsDollars: { current: 0, target: 0, max: 80 * avgTotalSeats * 50 },
        productivityOrThroughputBoostPercent: { current: 0, target: 0, max: 25 },
      },
    };
  }
   //TODO: remove the unused parameters from this method
  calculateTargets(org?: string | null): Promise<{ targets: Targets; logs?: unknown[] }> {
    // Pass the org parameter to TargetCalculationService for org-specific calculations
    return TargetCalculationService.fetchAndCalculateTargets(org || null, true, false); //always true for enableLogging for now  to audit calculations, always false for includeLogsInResponse.
  }

  //create default targets if they don't exist  
  async initialize() { 
    try {
      const Targets = mongoose.model('Targets');
      
      // Clean up database: Remove old indexes and incompatible records
      try {
        // Drop old 'scope' index if it exists (from previous schema versions)
        await Targets.collection.dropIndex('scope_1');
        logger.info('Dropped old scope_1 index');
      } catch (dropError) {
        // Index might not exist, which is expected for clean installations
        logger.debug('scope_1 index not found (expected for new installations)');
      }
      
      // Remove any records that have the old 'scope' field but no 'orgOrEnterprise' field
      const recordsWithOldScopeField = await Targets.deleteMany({ 
        scope: { $exists: true },
        orgOrEnterprise: { $exists: false }
      });
      
      if (recordsWithOldScopeField.deletedCount > 0) {
        logger.info(`Removed ${recordsWithOldScopeField.deletedCount} old target records with 'scope' field`);
      }
      
      // Migration: Handle existing records without orgOrEnterprise field
      const recordsWithoutOrgField = await Targets.find({ 
        orgOrEnterprise: { $exists: false } 
      });
      
      if (recordsWithoutOrgField.length > 0) {
        logger.info(`Found ${recordsWithoutOrgField.length} target records without orgOrEnterprise field. Migrating to enterprise-wide...`);
        
        // For migration of existing data, default to enterprise-wide targets for safety
        // Users can create org-specific targets later through the UI
        await Targets.updateMany(
          { orgOrEnterprise: { $exists: false } },
          { $set: { orgOrEnterprise: "1" } }
        );
        
        logger.info('Migration completed: existing target records migrated to enterprise-wide (orgOrEnterprise "1")');
      }
      
      // Ensure we have enterprise-wide targets as a system fallback
      const existingTargets = await Targets.findOne();
      
      if (!existingTargets) {
        // No targets exist at all - create enterprise-wide targets as the base
        const result = await this.calculateTargets();
        await Targets.create({ ...result.targets, orgOrEnterprise: "1" });
        logger.info('Initial enterprise-wide targets created (orgOrEnterprise "1")');
      } else {
        logger.info('Target records exist, skipping initial creation');
      }
    } catch (error) {
      logger.error('Error during target initialization:', error);
      throw new Error(`Error initializing target values: ${error}`);
    }
  }
}

export default new TargetValuesService();