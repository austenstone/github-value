import { Injectable } from '@angular/core';
import { CopilotMetrics } from './metrics.service.interfaces';
import { DashboardCardBarsInput } from '../main/copilot/copilot-dashboard/dashboard-card/dashboard-card-bars/dashboard-card-bars.component';

@Injectable({
  providedIn: 'root'
})
export class HighchartsService {

  constructor() { }

  getSunburstDataFromCopilotMetrics(data: any) {
    const result: {
      id: string;
      parent: string;
      name: string;
      value?: number;
    }[] = [
        {
          id: '0.0',
          parent: '',
          name: 'Engagement'
        },
        {
          id: '1.1',
          parent: '0.0',
          name: 'IDE Completions'
        },
        {
          id: '1.2',
          parent: '0.0',
          name: 'Chat'
        },
        {
          id: '1.3',
          parent: '0.0',
          name: 'Pull Requests'
        }
      ];

    // Process IDE editors
    data.copilot_ide_code_completions.editors.forEach((editor: any, editorIndex: number) => {
      // Add editor node
      result.push({
        id: `2.${editorIndex + 1}`,
        parent: '1.1',
        name: editor.name,
        value: editor.total_code_acceptances
      });

      // Process languages for each editor
      editor.models[0].languages.forEach((lang: any, langIndex: number) => {
        result.push({
          id: `3.${editorIndex + 1}.${langIndex + 1}`,
          parent: `2.${editorIndex + 1}`,
          name: lang.name,
          value: lang.total_code_acceptances
        });
      });
    });

    // Process Chat data
    data.copilot_ide_chat.editors.forEach((editor: any, editorIndex: number) => {
      result.push({
        id: `2.chat.${editorIndex + 1}`,
        parent: '1.2',
        name: editor.name,
        value: editor.models[0].total_chats
      });
    });

    // Add dotcom chat
    result.push({
      id: '2.chat.dotcom',
      parent: '1.2',
      name: 'GitHub.com',
      value: data.copilot_dotcom_chat.total_chats
    });

    // Process PR data
    data.copilot_dotcom_pull_requests.repositories.forEach((repo: any, repoIndex: number) => {
      result.push({
        id: `2.pr.${repoIndex + 1}`,
        parent: '1.3',
        name: repo.name || 'Unknown',
        value: repo.total_pr_summaries_created
      });
    });

    return result;
  }

  transformCopilotMetricsToBarChatDrilldown(data: any[]) {
    data.map(dateData => {
      const date = new Date(dateData.date);
      dateData.date = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return data;
    })
    const engagedUsersSeries = {
      name: 'Users',
      type: 'column' as 'column' | 'spline',
      data: data.map(dateData => ({
        type: 'column',
        name: dateData.date,
        y: dateData.total_engaged_users,
        drilldown: `date_${dateData.date}`,
      }))
    } as any;

    const drilldownSeries: any[] = [];

    data.forEach(dateData => {
      // First level drilldown - main categories
      const dateSeriesId = `date_${dateData.date}`;
      drilldownSeries.push({
        name: dateData.date,
        id: dateSeriesId,
        data: [
          {
            name: 'IDE Completions',
            y: dateData.copilot_ide_code_completions.total_engaged_users,
            drilldown: `ide_${dateData.date}`
          },
          {
            name: 'IDE Chat',
            y: dateData.copilot_ide_chat.total_engaged_users,
            drilldown: `chat_${dateData.date}`
          },
          {
            name: 'GitHub.com Chat',
            y: dateData.copilot_dotcom_chat?.total_engaged_users || 0,
            drilldown: `dotcom_chat_${dateData.date}`
          },
          {
            name: 'Pull Requests',
            y: dateData.copilot_dotcom_pull_requests.total_engaged_users,
            drilldown: `pr_${dateData.date}`
          }
        ].sort((a: any, b: any) => b.y - a.y)
      });

      // IDE Completions drilldown
      drilldownSeries.push({
        name: 'IDE Completions',
        id: `ide_${dateData.date}`,
        data: dateData.copilot_ide_code_completions.editors.map((editor: any) => ({
          name: editor.name,
          y: editor.total_engaged_users,
          drilldown: `ide_${editor.name}_${dateData.date}`
        })).sort((a: any, b: any) => b.y - a.y)
      });

      // Editor language drilldowns
      dateData.copilot_ide_code_completions.editors.forEach((editor: any) => {
        drilldownSeries.push({
          name: editor.name,
          id: `ide_${editor.name}_${dateData.date}`,
          data: editor.models.map((model: any) => ({
            name: model.name,
            y: model.total_engaged_users,
            drilldown: `ide_${editor.name}_${model.name}_${dateData.date}`
          })).sort((a: any, b: any) => b.y - a.y)
        });

        // Model languages drilldown
        editor.models.forEach((model: any) => {
          drilldownSeries.push({
            name: `${model.name} Languages`,
            id: `ide_${editor.name}_${model.name}_${dateData.date}`,
            data: model.languages.map((lang: any) => [
              lang.name,
              lang.total_engaged_users
            ]).sort((a: any, b: any) => b[1] - a[1])
          });
        });
      });

      // Chat drilldown (Editor level)
      drilldownSeries.push({
        name: 'IDE Chat',
        id: `chat_${dateData.date}`,
        data: dateData.copilot_ide_chat.editors.map((editor: any) => ({
          name: editor.name,
          y: editor.total_engaged_users,
          drilldown: `chat_${editor.name}_${dateData.date}`
        })).sort((a: any, b: any) => b.y - a.y)
      });

      // Chat models drilldown
      dateData.copilot_ide_chat.editors.forEach((editor: any) => {
        drilldownSeries.push({
          name: editor.name,
          id: `chat_${editor.name}_${dateData.date}`,
          data: editor.models.map((model: any) => ({
            name: model.name,
            y: model.total_engaged_users,
          })).sort((a: any, b: any) => b.y - a.y)
        });
      });

      // GitHub.com Chat drilldown (Model level)
      drilldownSeries.push({
        name: 'GitHub.com Chat',
        id: `dotcom_chat_${dateData.date}`,
        data: dateData.copilot_dotcom_chat?.models?.map((model: any) => ({
          name: model.name,
          y: model.total_engaged_users,
          custom: {
            totalChats: model.total_chats
          }
        })).sort((a: any, b: any) => b.y - a.y) || []
      });

      // PR drilldown (Repo level)
      drilldownSeries.push({
        name: 'Pull Requests',
        id: `pr_${dateData.date}`,
        data: dateData.copilot_dotcom_pull_requests.repositories.map((repo: any) => ({
          name: repo.name || 'Unknown',
          y: repo.total_engaged_users,
          drilldown: `pr_${repo.name}_${dateData.date}`
        })).sort((a: any, b: any) => b.y - a.y)
      });

      // PR models drilldown
      dateData.copilot_dotcom_pull_requests.repositories.forEach((repo: any) => {
        drilldownSeries.push({
          name: `${repo.name || 'Unknown'} Models`,
          id: `pr_${repo.name}_${dateData.date}`,
          data: repo.models.map((model: any) => ({
            name: model.name,
            y: model.total_engaged_users,
          })).sort((a: any, b: any) => b.y - a.y)
        });
      });
    });

    return {
      series: [engagedUsersSeries],
      drilldown: {
        series: drilldownSeries
      }
    };
  }

  transformCopilotMetricsToBars(data: CopilotMetrics, totalSeats: number): DashboardCardBarsInput[] {
    return [
      { name: 'IDE Code Completion', icon: 'code', value: data.copilot_ide_code_completions?.total_engaged_users || 0, maxValue: totalSeats },
      { name: 'IDE Chat', icon: 'chat', value: data.copilot_ide_chat?.total_engaged_users || 0, maxValue: totalSeats },
      { name: '.COM Chat', icon: 'public', value: data.copilot_dotcom_chat?.total_engaged_users || 0, maxValue: totalSeats },
      { name: '.COM PRs', icon: 'merge', value: data.copilot_dotcom_pull_requests?.total_engaged_users || 0, maxValue: totalSeats },
    ];
  }
}