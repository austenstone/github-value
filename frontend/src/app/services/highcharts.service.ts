import { Injectable } from '@angular/core';
import { CopilotMetrics } from './metrics.service.interfaces';
import { DashboardCardBarsInput } from '../main/copilot/copilot-dashboard/dashboard-card/dashboard-card-bars/dashboard-card-bars.component';
import { ActivityResponse, Seat } from './seat.service';
import Highcharts from 'highcharts/es-modules/masters/highcharts.src';
import { Survey } from './copilot-survey.service';

interface CustomHighchartsPoint extends Highcharts.PointOptionsObject {
  date?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

interface CustomHighchartsGanttPoint extends Highcharts.GanttPointOptionsObject {
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
      const currentMetrics = metrics.find(m => m.date.startsWith(date.slice(0, 10)));
      if (currentMetrics?.copilot_ide_code_completions) {
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

  transformSurveysToScatter(surveys: Survey[]): Highcharts.Options {
    return {
      series: [{
        name: 'Time Saved',
        type: 'spline' as const,
        data: surveys.map(survey => ({
          x: new Date(survey.dateTime).getTime(),
          y: survey.percentTimeSaved,
        })),
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
      }, {
        type: 'scatter' as const,
        name: 'Survey',
        data: surveys.map(survey => ({
          x: new Date(survey.dateTime).getTime(),
          y: survey.percentTimeSaved,
          raw: survey
        })),
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
      }],
      tooltip: {
        headerFormat: '<b>{point.x:%b %d, %Y}</b><br/>',
        pointFormatter: function () {
          return [
            `User: `,
            '<b>' + (this as any).raw.userId + '</b>',
            `</br>Time saved: `,
            '<b>' + Math.round(this.y || 0) + '%</b>',
            `</br>PR: `,
            '<b>#' + (this as any).raw.prNumber + '</b>',
          ].join('');
        }
      }
    };
  }

  transformSeatActivityToGantt(seatActivity: Seat[]): Highcharts.Options {
    const editorGroups = seatActivity.reduce((acc, seat) => {
      const editor = seat.last_activity_editor?.split('/')[0] || 'unknown';
      if (!acc[editor]) {
        acc[editor] = [];
      }
      acc[editor].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);
    const getEditorIndex = (seat: Seat) => {
      return Object.keys(editorGroups).findIndex(editor => editorGroups[editor].includes(seat));
    }
    const getEditorColor = (seat: Seat) => {
      return ({
        'vscode': '#007ACC', // VS Code blue
        'intellij': '#FC801D', // IntelliJ orange
        'sublime': '#FF9800', // Sublime orange
        'atom': '#66595C', // Atom dark grey
        'vim': '#019733', // Vim green
        'unknown': '#808080' // Grey for unknown
      })[seat.last_activity_editor?.split('/')[0] || 'unknown'];
    }
    
    return {
      chart: {
        zooming: {
          type: 'x'
        }
      },
      title: {
        text: undefined
      },
      series: [{
        name: 'Seat Activity',
        type: 'gantt' as const,
        data: seatActivity.reduce((acc, seat, index) => {
          const lastSeatActivity = seatActivity[index - 1];
    
          // Skip if same activity timestamp as previous (no new activity) 🕐
          if (
            lastSeatActivity?.last_activity_at === seat.last_activity_at &&
            lastSeatActivity?.last_activity_editor === seat.last_activity_editor
          ) {
            return acc;
          }
      
          const activityTime = new Date(Date.parse(seat.last_activity_at || seat.created_at));
          
          // For first activity or new activity timestamp 📊
          acc.push({
            name: String(seat.assignee?.login || `Seat ${seat.assignee?.id}`),
            start: activityTime.getTime(),
            // End time is either next activity or current time
            end: index < seatActivity.length - 1 
              ? new Date(Date.parse(seatActivity[index + 1].last_activity_at || seatActivity[index + 1].created_at)).getTime()
              : activityTime.getTime() + (60 * 60 * 1000), // Add 1 hour for last activity
            y: getEditorIndex(seat),
            color: getEditorColor(seat),
            raw: seat,
          });
          
          return acc;
        }, [] as CustomHighchartsGanttPoint[]),
      }] as Highcharts.SeriesGanttOptions[],
      tooltip: {
        formatter: function() {
          const point: CustomHighchartsGanttPoint = this.point;
          return `<b>${point.name}</b><br/>
                  Editor: ${point.raw.last_activity_editor}<br/>
                  Start: ${new Date(point.start || 0).toLocaleString()}<br/>
                  End: ${new Date(point.end || 0).toLocaleString()}`;
        }
      },
      xAxis: {
        zoomEnabled: true,
        type: 'datetime',
        min: new Date(seatActivity[0].last_activity_at || seatActivity[0].created_at).getTime(),
        max: new Date().getTime(),
      },
      yAxis: {
        type: 'category',
        categories: Object.keys(editorGroups).map(editor => editor.toLowerCase()),
      }
    };
  }
}
