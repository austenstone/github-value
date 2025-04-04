import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Interface for the main application with GitHub installations
 */
interface ServerApp {
  github?: {
    installations?: Array<{
      installation: {
        repositories_url: string;
        [key: string]: any;
      };
      octokit: {
        request: (url: string) => Promise<{
          data: { repositories: unknown[] };
        }>;
      };
    }>;
  };
}

/**
 * Status states for components
 */
export type ComponentStatus = 'starting' | 'running' | 'error' | 'warning' | 'stopping' | 'stopped';
export type ComponentType = string;

/**
 * Component status information with history
 */
export interface ComponentStatusInfo {
  currentStatus: ComponentStatus;
  lastUpdated: Date;
  history: StatusHistoryEntry[];
  message?: string;
}

/**
 * History entry for component status changes
 */
export interface StatusHistoryEntry {
  timestamp: Date;
  status: ComponentStatus;
  message?: string;
}

export interface SystemStatus {
  status: Record<string, ComponentStatus>;
  componentDetails: Record<string, ComponentStatusInfo>;
  isReady: boolean;
  uptime: number;
  startTime: string;
  seatsHistory?: {
    oldestCreatedAt: string;
    daysSinceOldestCreatedAt?: number;
  };
  installations?: any[];
  surveyCount: number;
}

/**
 * StatusManager - Centralized service to track the status of various application components
 */
class StatusManager extends EventEmitter {
  private components: Map<string, ComponentStatusInfo> = new Map();
  private appStartTime: Date = new Date();
  private healthChecks: Map<string, () => Promise<{ status: ComponentStatus; message?: string }>> = new Map();
  private maxHistoryLength: number = 10;
  private app?: ServerApp;
  
  constructor() {
    super();
    logger.info('StatusManager initialized');
    this.scheduleHealthChecks();
  }

  initialize(app: ServerApp) {
    this.app = app;
    this.registerComponent('status-service', 'running', 'Status monitoring active');
  }

  registerComponent(
    componentName: string, 
    initialStatus: ComponentStatus = 'starting',
    message?: string
  ): void {
    const componentInfo: ComponentStatusInfo = {
      currentStatus: initialStatus,
      lastUpdated: new Date(),
      history: [
        {
          timestamp: new Date(),
          status: initialStatus,
          message
        }
      ],
      message
    };
    
    this.components.set(componentName, componentInfo);
    
    // Emit event for new component registration
    this.emit('component:registered', componentName, componentInfo);
    
    logger.debug(`Registered component ${componentName} with status ${initialStatus}`);
  }

  updateStatus(
    componentName: string, 
    status: ComponentStatus,
    message?: string
  ): void {
    const componentInfo = this.components.get(componentName);
    
    if (!componentInfo) {
      // Component not registered yet, register it first
      this.registerComponent(componentName, status, message);
      return;
    }
    
    // Update the component status
    componentInfo.currentStatus = status;
    componentInfo.lastUpdated = new Date();
    componentInfo.message = message;
    
    // Add to history
    componentInfo.history.push({
      timestamp: new Date(),
      status,
      message
    });
    
    // Maintain history length
    if (componentInfo.history.length > this.maxHistoryLength) {
      componentInfo.history = componentInfo.history.slice(
        componentInfo.history.length - this.maxHistoryLength
      );
    }
    
    // Emit event for status change
    this.emit('component:status-changed', componentName, status, message);
    
    logger.debug(`Updated component ${componentName} status to ${status}${message ? ': ' + message : ''}`);
  }

  getStatusHistory(componentName: string): StatusHistoryEntry[] {
    const componentInfo = this.components.get(componentName);
    if (!componentInfo) {
      return [];
    }
    return [...componentInfo.history];
  }

  getComponentStatus(componentName: string): ComponentStatusInfo | null {
    return this.components.get(componentName) || null;
  }

  public getAllComponentStatuses(): Record<string, ComponentStatus> {
    const statuses: Record<string, ComponentStatus> = {};

    this.components.forEach((info, name) => {
      statuses[name] = info.currentStatus;
    });
    
    return statuses;
  }

  getAllComponentDetails(): Record<string, ComponentStatusInfo> {
    const details: Record<string, ComponentStatusInfo> = {};
    
    this.components.forEach((info, name) => {
      details[name] = { ...info };
    });
    
    return details;
  }

  isSystemHealthy(): boolean {
    let isHealthy = true;
    
    this.components.forEach((info) => {
      if (info.currentStatus === 'error') {
        isHealthy = false;
      }
    });
    
    return isHealthy;
  }

  isSystemReady(): boolean {
    // System is considered ready when all components are running or in warning state
    // (errors mean not ready)
    let isReady = true;
    
    this.components.forEach((info) => {
      if (info.currentStatus === 'error' || info.currentStatus === 'starting') {
        isReady = false;
      }
    });
    
    return isReady;
  }

  getUptime(): number {
    return Math.floor((new Date().getTime() - this.appStartTime.getTime()) / 1000);
  }

  getStartTime(): Date {
    return this.appStartTime;
  }

  monitorComponent(
    componentName: string,
    checkFn: () => Promise<{ status: ComponentStatus; message?: string }>
  ): void {
    this.healthChecks.set(componentName, checkFn);
    logger.debug(`Registered health check for component ${componentName}`);
  }

  async runHealthChecks(): Promise<Record<string, { status: ComponentStatus; message?: string }>> {
    const results: Record<string, { status: ComponentStatus; message?: string }> = {};
    
    const checkPromises: Promise<void>[] = [];
    
    this.healthChecks.forEach((checkFn, componentName) => {
      const checkPromise = checkFn()
        .then(result => {
          results[componentName] = result;
          
          // Update the component status if health check result differs
          const currentStatus = this.getComponentStatus(componentName);
          if (currentStatus && currentStatus.currentStatus !== result.status) {
            this.updateStatus(componentName, result.status, result.message);
          }
        })
        .catch(error => {
          logger.error(`Health check failed for component ${componentName}`, error);
          results[componentName] = { 
            status: 'error', 
            message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
          
          // Update component status to error
          this.updateStatus(componentName, 'error', `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
      
      checkPromises.push(checkPromise);
    });
    
    await Promise.all(checkPromises);
    
    // Also emit health check results
    this.emit('healthcheck:completed', results);
    
    return results;
  }

  scheduleHealthChecks(intervalMs: number = 60000): NodeJS.Timeout {
    const interval = setInterval(() => {
      this.runHealthChecks()
        .catch(error => {
          logger.error('Error running scheduled health checks', error);
        });
    }, intervalMs);
    
    return interval;
  }

  async getStatus(): Promise<SystemStatus> {
    // Run health checks to ensure statuses are up to date
    await this.runHealthChecks();
    
    const status: SystemStatus = {
      status: this.getAllComponentStatuses(),
      componentDetails: this.getAllComponentDetails(),
      isReady: this.isSystemReady(),
      uptime: this.getUptime(),
      startTime: this.getStartTime().toISOString(),
      surveyCount: 0
    };

    // Add additional details if database is connected
    if (mongoose.connection.readyState === 1) {
      // Get seats history information
      const Seats = mongoose.model('Seats');
      const oldestSeat = await Seats.findOne().sort({ createdAt: 1 });
      const daysSince = oldestSeat ? Math.floor((new Date().getTime() - oldestSeat.createdAt.getTime()) / (1000 * 3600 * 24)) : undefined;
      
      status.seatsHistory = {
        oldestCreatedAt: oldestSeat?.createdAt.toISOString() || 'No data',
        daysSinceOldestCreatedAt: daysSince
      };

      // Count surveys
      const Survey = mongoose.model('Survey');
      status.surveyCount = await Survey.countDocuments();
    }

    // Get GitHub installations if available
    if (this.app?.github?.installations?.length > 0) {
      status.installations = [];
      for (const installation of this.app.github.installations) {
        const repos = await installation.octokit.request(installation.installation.repositories_url);
        status.installations.push({
          installation: installation.installation,
          repos: repos.data.repositories
        });
      }
    }

    return status;
  }
}

export default new StatusManager();