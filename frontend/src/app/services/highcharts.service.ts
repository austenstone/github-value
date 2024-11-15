import { Injectable } from '@angular/core';
import { CopilotMetrics } from './metrics.service.interfaces';
import { DashboardCardBarsInput } from '../main/copilot/copilot-dashboard/dashboard-card/dashboard-card-bars/dashboard-card-bars.component';
import { ActivityResponse } from './seat.service';
import Highcharts from 'highcharts/es-modules/masters/highcharts.src';

interface CustomHighchartsPoint extends Highcharts.PointOptionsObject {
  date?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

@Injectable({
  providedIn: 'root'
})
export class HighchartsService {
  transformCopilotMetricsToBarChartDrilldown(data: CopilotMetrics[]): Highcharts.Options {
    const engagedUsersSeries: Highcharts.SeriesOptionsType = {
      name: 'Users',
      type: 'column' as const,
      data: data.map(dateData => {
        const date = new Date(dateData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          type: 'column',
          name: date,
          y: dateData.total_engaged_users,
          date: new Date(dateData.date),
          drilldown: `date_${dateData.date}`,
        }
      })
    };

    const drilldownSeries: Highcharts.SeriesOptionsType[] = [];

    data.forEach(dateData => {
      const dateSeriesId = `date_${dateData.date}`;
      drilldownSeries.push({
        type: 'column',
        name: new Date(dateData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' }),
        id: dateSeriesId,
        data: [
          {
            name: 'IDE Completions',
            y: dateData.copilot_ide_code_completions?.total_engaged_users || 0,
            drilldown: `ide_${dateData.date}`
          },
          {
            name: 'IDE Chat',
            y: dateData.copilot_ide_chat?.total_engaged_users || 0,
            drilldown: `chat_${dateData.date}`
          },
          {
            name: 'GitHub.com Chat',
            y: dateData.copilot_dotcom_chat?.total_engaged_users || 0,
            drilldown: `dotcom_chat_${dateData.date}`
          },
          {
            name: 'Pull Requests',
            y: dateData.copilot_dotcom_pull_requests?.total_engaged_users || 0,
            drilldown: `pr_${dateData.date}`
          }
        ].sort((a, b) => b.y - a.y)
      });

      // IDE Completions drilldown
      drilldownSeries.push({
        type: 'column',
        name: 'IDE Completions',
        id: `ide_${dateData.date}`,
        data: dateData.copilot_ide_code_completions?.editors.map((editor) => ({
          name: editor.name,
          y: editor.total_engaged_users,
          drilldown: `ide_${editor.name}_${dateData.date}`
        })).sort((a, b) => b.y - a.y)
      });

      // Editor language drilldowns
      dateData.copilot_ide_code_completions?.editors.forEach((editor) => {
        drilldownSeries.push({
          type: 'column',
          name: editor.name,
          id: `ide_${editor.name}_${dateData.date}`,
          data: editor.models.map((model) => ({
            name: model.name,
            y: model.total_engaged_users,
            drilldown: `ide_${editor.name}_${model.name}_${dateData.date}`
          })).sort((a, b) => b.y - a.y)
        });

        // Model languages drilldown
        editor.models.forEach((model) => {
          if ('languages' in model) {
            drilldownSeries.push({
              type: 'column',
              name: `${model.name} Languages`,
              id: `ide_${editor.name}_${model.name}_${dateData.date}`,
              data: model.languages.map((lang): [string, number] => [
                lang.name,
                lang.total_engaged_users
              ]).sort((a, b) => b[1] - a[1])
            });
          }
        });
      });

      // Chat drilldown (Editor level)
      drilldownSeries.push({
        type: 'column',
        name: 'IDE Chat',
        id: `chat_${dateData.date}`,
        data: dateData.copilot_ide_chat?.editors?.map((editor) => ({
          name: editor.name,
          y: editor.total_engaged_users,
          drilldown: `chat_${editor.name}_${dateData.date}`
        })).sort((a, b) => b.y - a.y)
      });

      // Chat models drilldown
      dateData.copilot_ide_chat?.editors?.forEach((editor) => {
        drilldownSeries.push({
          type: 'column',
          name: editor.name,
          id: `chat_${editor.name}_${dateData.date}`,
          data: editor.models.map((model) => ({
            name: model.name,
            y: model.total_engaged_users,
          })).sort((a, b) => b.y - a.y)
        });
      });

      // GitHub.com Chat drilldown (Model level)
      drilldownSeries.push({
        type: 'column',
        name: 'GitHub.com Chat',
        id: `dotcom_chat_${dateData.date}`,
        data: dateData.copilot_dotcom_chat?.models?.map((model) => ({
          name: model.name,
          y: model.total_engaged_users,
          custom: {
            totalChats: model.total_chats
          }
        })).sort((a, b) => b.y - a.y) || []
      });

      // PR drilldown (Repo level)
      drilldownSeries.push({
        type: 'column',
        name: 'Pull Requests',
        id: `pr_${dateData.date}`,
        data: dateData.copilot_dotcom_pull_requests?.repositories.map((repo) => ({
          name: repo.name || 'Unknown',
          y: repo.total_engaged_users,
          drilldown: `pr_${repo.name}_${dateData.date}`
        })).sort((a, b) => b.y - a.y)
      });

      // PR models drilldown
      dateData.copilot_dotcom_pull_requests?.repositories.forEach((repo) => {
        drilldownSeries.push({
          type: 'column',
          name: `${repo.name || 'Unknown'} Models`,
          id: `pr_${repo.name}_${dateData.date}`,
          data: repo.models.map((model) => ({
            name: model.name,
            y: model.total_engaged_users,
          })).sort((a, b) => b.y - a.y)
        });
      });
    });

    return {
      series: [engagedUsersSeries],
      drilldown: {
        series: drilldownSeries
      },
      tooltip: {
        headerFormat: '<span>{series.name}</span><br>',
        pointFormatter: function (this: CustomHighchartsPoint) {
          const formatted = this.date ? this.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : this.name;
          return `<span style="color:${this.color}">${formatted}</span>: <b>${this.y}</b> users<br/>`;
        }
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

  transformActivityMetricsToLine(data: ActivityResponse): Highcharts.Options {
    const activeUsersSeries = {
      name: 'Users',
      type: 'spline' as const,
      data: Object.entries(data).map(([date, dateData]) => {
        return {
          x: new Date(date).getTime(),
          y: (dateData.totalActive / dateData.totalSeats) * 100,
          raw: dateData.totalActive  // Store original value for tooltip
        };
      }),
      lineWidth: 2,
      marker: {
        enabled: true,
        radius: 4,
        symbol: 'circle'
      },
      states: {
        hover: {
          lineWidth: 3
        }
      }
    };

    return {
      series: [activeUsersSeries],
    };
  }

  transformMetricsToDailyActivityLine(activity: ActivityResponse, metrics: CopilotMetrics[]): Highcharts.Options {
    const initialSeries = {
      name: 'Active Users',
      type: 'spline' as const,
      data: [],
      lineWidth: 2,
      marker: {
        enabled: true,
        radius: 4,
        symbol: 'circle'
      },
      states: {
        hover: {
          lineWidth: 3
        }
      }
    };
    const dailyActiveIdeCompletionsSeries = {
      ...initialSeries,
      name: 'IDE Completions',
      data: [] as CustomHighchartsPoint[]
    };
    const dailyActiveIdeChatSeries = {
      ...initialSeries,
      name: 'IDE Chats',
      data: [] as CustomHighchartsPoint[]
    };
    const dailyActiveDotcomChatSeries = {
      ...initialSeries,
      name: '.COM Chats',
      data: [] as CustomHighchartsPoint[]
    };
    const dailyActiveDotcomPrSeries = {
      ...initialSeries,
      name: '.COM Pull Requests',
      data: [] as CustomHighchartsPoint[]
    };

    Object.entries(activity).forEach(([date, dateData]) => {
      const currentMetrics = metrics.find(m => m.date.startsWith(date));
      if (currentMetrics?.copilot_ide_code_completions) {
        console.log(`date: ${date} total_code_suggestions: ${currentMetrics.copilot_ide_code_completions.total_code_suggestions} totalActive: ${dateData.totalActive} percentage: ${(currentMetrics.copilot_ide_code_completions.total_code_suggestions / dateData.totalActive)}`);
        (dailyActiveIdeCompletionsSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_ide_code_completions.total_code_suggestions / dateData.totalActive),
          raw: date
        });
      }
      if (currentMetrics?.copilot_ide_chat) {
        (dailyActiveIdeChatSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_ide_chat.total_chats / dateData.totalActive),
          raw: date
        });
      }
      if (currentMetrics?.copilot_dotcom_chat) {
        (dailyActiveDotcomChatSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_dotcom_chat.total_chats / dateData.totalActive),
          raw: date
        });
      }
      if (currentMetrics?.copilot_dotcom_pull_requests) {
        (dailyActiveDotcomPrSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_dotcom_pull_requests.total_pr_summaries_created / dateData.totalActive),
          raw: date
        });
      }
    });

    return {
      series: [
        dailyActiveIdeCompletionsSeries,
        dailyActiveIdeChatSeries,
        dailyActiveDotcomChatSeries,
        dailyActiveDotcomPrSeries,
      ]
    }
  }
}
