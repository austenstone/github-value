import { EventEmitter } from 'events';
import { Router } from 'express';
import mongoose from 'mongoose';
import app from '../app.js';
import logger from './logger.js';

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

  /**
   * Initialize with ServerApp instance
   */
  initialize(app: ServerApp) {
    this.app = app;
    this.registerComponent('status-service', 'running', 'Status monitoring active');
  }

  /**
   * Register a new component with the status manager
   * @param componentName Name of the component
   * @param initialStatus Initial status of the component
   * @param message Optional message describing the current state
   */
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

  /**
   * Update the status of a component
   * @param componentName Name of the component
   * @param status New status of the component
   * @param message Optional message describing the current state
   */
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

  /**
   * Get the status history of a component
   * @param componentName Name of the component
   * @returns Array of status history entries or empty array if component not found
   */
  getStatusHistory(componentName: string): StatusHistoryEntry[] {
    const componentInfo = this.components.get(componentName);
    if (!componentInfo) {
      return [];
    }
    return [...componentInfo.history];
  }

  /**
   * Get the current status of a component
   * @param componentName Name of the component
   * @returns Component status information or null if component not found
   */
  getComponentStatus(componentName: string): ComponentStatusInfo | null {
    return this.components.get(componentName) || null;
  }

  /**
   * Get the current status of all components
   * @returns Object with component names as keys and their statuses
   */
  getAllComponentStatuses(): Record<string, ComponentStatus> {
    const statuses: Record<string, ComponentStatus> = {};
    
    this.components.forEach((info, name) => {
      statuses[name] = info.currentStatus;
    });
    
    return statuses;
  }

  /**
   * Get detailed status for all components
   * @returns Object with component names as keys and detailed status info
   */
  getAllComponentDetails(): Record<string, ComponentStatusInfo> {
    const details: Record<string, ComponentStatusInfo> = {};
    
    this.components.forEach((info, name) => {
      details[name] = { ...info };
    });
    
    return details;
  }

  /**
   * Check if all critical components are healthy
   * @returns true if all critical components have a 'running' status
   */
  isSystemHealthy(): boolean {
    let isHealthy = true;
    
    this.components.forEach((info) => {
      if (info.currentStatus === 'error') {
        isHealthy = false;
      }
    });
    
    return isHealthy;
  }

  /**
   * Check if the system is ready to serve requests
   * @returns true if the system is ready
   */
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

  /**
   * Get system uptime in seconds
   * @returns Uptime in seconds
   */
  getUptime(): number {
    return Math.floor((new Date().getTime() - this.appStartTime.getTime()) / 1000);
  }

  /**
   * Get system start time
   * @returns Start time as Date
   */
  getStartTime(): Date {
    return this.appStartTime;
  }

  /**
   * Register a health check function for a component
   * @param componentName Name of the component
   * @param checkFn Function that returns a promise resolving to status and message
   */
  monitorComponent(
    componentName: string,
    checkFn: () => Promise<{ status: ComponentStatus; message?: string }>
  ): void {
    this.healthChecks.set(componentName, checkFn);
    logger.debug(`Registered health check for component ${componentName}`);
  }

  /**
   * Run health checks on all registered components
   * @returns Object with component names as keys and their health check results
   */
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

  /**
   * Schedule periodic health checks
   * @param intervalMs Interval between health checks in milliseconds
   * @returns Timeout ID
   */
  scheduleHealthChecks(intervalMs: number = 60000): NodeJS.Timeout {
    const interval = setInterval(() => {
      this.runHealthChecks()
        .catch(error => {
          logger.error('Error running scheduled health checks', error);
        });
    }, intervalMs);
    
    return interval;
  }

  /**
   * Get system status including all components and additional information
   */
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

  /**
   * Configure Express routes for status endpoints
   */
  configureRoutes(app: ServerApp): Router {
    const router = Router();

    // Get full system status
    router.get('/', async (_req, res) => {
      const status = await this.getStatus();
      res.json(status);
    });

    // Get status for a specific component
    router.get('/:componentName', (req, res) => {
      const { componentName } = req.params;
      const status = this.getComponentStatus(componentName);
      
      if (status) {
        res.json(status);
      } else {
        res.status(404).json({ error: `Component '${componentName}' not found` });
      }
    });

    // Trigger a manual health check
    router.post('/healthcheck', async (_req, res) => {
      try {
        const results = await this.runHealthChecks();
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Check if application is ready
    router.get('/ready', (_req, res) => {
      const isReady = this.isSystemReady();
      if (isReady) {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready' });
      }
    });

    app.use('/api/status', router);
    return router;
  }
}

// Create a singleton instance
const statusManager = new StatusManager();

export default statusManager;