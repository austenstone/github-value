import { SystemStatus } from '../../../services/api/installations.service';
import { Survey } from '../../../services/api/copilot-survey.service';

export interface Status {
  title: string;
  message: string;
  status: 'error' | 'success' | 'warning';
}

export function getStatusInfo(systemStatus: SystemStatus, surveys?: Survey[]): Status[] {
  const statuses: Status[] = [];

  // Check system status
  if (systemStatus.isReady) {
    statuses.push({
      title: 'System Status',
      message: 'All systems operational',
      status: 'success'
    });
  } else {
    statuses.push({
      title: 'System Status',
      message: 'Some systems are not operational',
      status: 'warning'
    });
  }

  // Check installations
  if (!systemStatus.installations?.length) {
    statuses.push({
      title: 'GitHub App',
      message: 'No GitHub installations found',
      status: 'error'
    });
  }

  // Check surveys
  if (!surveys?.length) {
    statuses.push({
      title: 'Developer Surveys',
      message: 'No developer surveys collected',
      status: 'warning'
    });
  }

  return statuses;
}