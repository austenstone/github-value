import { Injectable } from '@angular/core';
import { ChatModel, CodeModel, CopilotMetrics, DotComChatShared, DotComPullRequestsShared, IdeChatShared, IdeCodeCompletionsShared } from './api/metrics.service.interfaces';
import { DashboardCardBarsInput } from '../main/copilot/copilot-dashboard/dashboard-card/dashboard-card-bars/dashboard-card-bars.component';
import { ActivityResponse, Seat } from './api/seat.service';
import * as Highcharts from 'highcharts';
import { Survey } from './api/copilot-survey.service';
import { DatePipe, DecimalPipe } from '@angular/common';

interface CustomHighchartsPoint extends Highcharts.Point {
  date?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
  customTooltipInfo?: () => string;
  totalUsers?: number;
}
interface CustomHighchartsPointOptions extends Highcharts.PointOptionsObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

interface CustomHighchartsGanttPoint extends Highcharts.GanttPointOptionsObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

@Injectable({
  providedIn: 'root'
})
export class HighchartsService {
  transformCopilotMetricsToBarChartDrilldown(data: CopilotMetrics[]): Highcharts.Options {
    const decimalPipe = new DecimalPipe('en-US');
    const customTooltipInfo = {
      'copilot_ide_code_completions': (data: IdeCodeCompletionsShared) => `Suggestions: ${decimalPipe.transform(data.total_code_suggestions)}
          <br>Accepted: ${decimalPipe.transform(data.total_code_acceptances)} (${((data.total_code_acceptances / data.total_code_suggestions) * 100).toFixed(2)}%)
          <br>LoC suggested: ${decimalPipe.transform(data.total_code_lines_suggested)}
          <br>LoC accepted: ${decimalPipe.transform(data.total_code_lines_accepted)}`,
      'copilot_ide_chat': (data: IdeChatShared) => `Chats: ${decimalPipe.transform(data.total_chats)}`,
      'copilot_dotcom_chat': (data: DotComChatShared) => `Chats: ${decimalPipe.transform(data.total_chats)}`,
      'copilot_dotcom_pull_requests': (data: DotComPullRequestsShared) => `Summaries: ${decimalPipe.transform(data.total_pr_summaries_created)}`
    }
    const topLevelTooltip = {
      headerFormat: '',
      pointFormatter: function (this: CustomHighchartsPoint) {
        const formatted = this.series.name;
        const parts = [
          `<b>${new Date(this.date || 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</b>: ${this.totalUsers} users<br>`,
          `<b><span style="color:${this.color}">${formatted}</span></b>: ${this.y} users<br>`,
          ``
        ]
        if (this.customTooltipInfo) parts.push(this.customTooltipInfo());
        return parts.join('');
      }
    };

    const convertedDate = (date: string) => {
      // Extract YYYY-MM-DD from the UTC string
      const dateParts = date.split('T')[0].split('-');
      // Create new date using local time (no UTC conversion)
      const localDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1, // months are 0-based
        parseInt(dateParts[2])
      );
      return localDate;
    };
    const ideCompletionsSeries: Highcharts.SeriesOptionsType = {
      name: 'IDE Suggestions',
      type: 'column',
      data: data.map(dateData => ({
        name: convertedDate(dateData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalUsers: dateData.total_engaged_users,
        y: dateData.copilot_ide_code_completions?.total_engaged_users || 0,
        date: convertedDate(dateData.date),
        drilldown: `ide_${dateData.date}`,
        customTooltipInfo: () => customTooltipInfo.copilot_ide_code_completions(dateData.copilot_ide_code_completions!),
      })),
      tooltip: topLevelTooltip
    };

    const ideChatSeries: Highcharts.SeriesOptionsType = {
      name: 'IDE Chat',
      type: 'column',
      data: data.map(dateData => ({
        name: convertedDate(dateData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalUsers: dateData.total_engaged_users,
        y: dateData.copilot_ide_chat?.total_engaged_users || 0,
        date: convertedDate(dateData.date),
        drilldown: `chat_${dateData.date}`,
        customTooltipInfo: () => customTooltipInfo.copilot_ide_chat(dateData.copilot_ide_chat!)
      })),
      tooltip: topLevelTooltip
    };

    const dotcomChatSeries: Highcharts.SeriesOptionsType = {
      name: 'GitHub.com Chat',
      type: 'column',
      data: data.map(dateData => ({
        name: convertedDate(dateData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalUsers: dateData.total_engaged_users,
        y: dateData.copilot_dotcom_chat?.total_engaged_users || 0,
        date: convertedDate(dateData.date),
        drilldown: `dotcom_chat_${dateData.date}`,
        customTooltipInfo: () => customTooltipInfo.copilot_dotcom_chat(dateData.copilot_dotcom_chat!)
      })),
      tooltip: topLevelTooltip
    };

    const prSeries: Highcharts.SeriesOptionsType = {
      name: 'Pull Requests',
      type: 'column',
      data: data.map(dateData => ({
        name: convertedDate(dateData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalUsers: dateData.total_engaged_users,
        y: dateData.copilot_dotcom_pull_requests?.total_engaged_users || 0,
        date: convertedDate(dateData.date),
        drilldown: `pr_${dateData.date}`,
        customTooltipInfo: () => customTooltipInfo.copilot_dotcom_pull_requests(dateData.copilot_dotcom_pull_requests!),
      })),
      tooltip: topLevelTooltip
    };

    const drilldownSeries: Highcharts.SeriesOptionsType[] = [];

    data.forEach(dateData => {
      const dateSeriesId = `date_${dateData.date}`;
      drilldownSeries.push({
        type: 'column',
        name: convertedDate(dateData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        id: dateSeriesId,
        data: [
          {
            name: 'IDE Completions',
            y: dateData.copilot_ide_code_completions?.total_engaged_users || 0,
            drilldown: `ide_${dateData.date}`,
            customTooltipInfo: () => customTooltipInfo.copilot_ide_code_completions(dateData.copilot_ide_code_completions!)
          },
          {
            name: 'IDE Chat',
            y: dateData.copilot_ide_chat?.total_engaged_users || 0,
            drilldown: `chat_${dateData.date}`,
            customTooltipInfo: () => customTooltipInfo.copilot_ide_chat(dateData.copilot_ide_chat!)
          },
          {
            name: 'GitHub.com Chat',
            y: dateData.copilot_dotcom_chat?.total_engaged_users || 0,
            drilldown: `dotcom_chat_${dateData.date}`,
            customTooltipInfo: () => customTooltipInfo.copilot_dotcom_chat(dateData.copilot_dotcom_chat!)
          },
          {
            name: 'Pull Requests',
            y: dateData.copilot_dotcom_pull_requests?.total_engaged_users || 0,
            drilldown: `pr_${dateData.date}`,
            customTooltipInfo: () => customTooltipInfo.copilot_dotcom_pull_requests(dateData.copilot_dotcom_pull_requests!)
          }
        ].sort((a, b) => b.y - a.y)
      });

      if (dateData.copilot_ide_code_completions?.editors) {
        // IDE Completions drilldown
        drilldownSeries.push({
          type: 'column',
          name: 'IDE Completions',
          id: `ide_${dateData.date}`,
          data: dateData.copilot_ide_code_completions?.editors.map((editor) => ({
            name: editor.name,
            y: editor.total_engaged_users,
            drilldown: `ide_${editor.name}_${dateData.date}`,
            color: this.getEditorColor(editor.name.split('/')[0]),
            customTooltipInfo: () => customTooltipInfo.copilot_ide_code_completions(editor)
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
              drilldown: `ide_${editor.name}_${model.name}_${dateData.date}`,
              customTooltipInfo: () => customTooltipInfo.copilot_ide_code_completions(model)
            })).sort((a, b) => b.y - a.y)
          });

          // Model languages drilldown
          editor.models.forEach((model) => {
            drilldownSeries.push({
              type: 'column',
              name: `${model.name} Languages`,
              id: `ide_${editor.name}_${model.name}_${dateData.date}`,
              data: (model as CodeModel).languages.map((language) => ({
                name: language.name,
                y: language.total_engaged_users,
                color: this.getLanguageColor(language.name),
                drilldown: `lang_${editor.name}_${model.name}_${language.name}_${dateData.date}`,
                customTooltipInfo: () => customTooltipInfo.copilot_ide_code_completions(language)
              })).sort((a, b) => b.y - a.y)
            });
            // Add acceptance stats drilldown for each language
            (model as CodeModel).languages.forEach((language) => {
              drilldownSeries.push({
                type: 'column',
                name: `${language.name} Suggestions`,
                id: `lang_${editor.name}_${model.name}_${language.name}_${dateData.date}`,
                data: [
                  {
                    name: 'Suggestions',
                    y: (language.total_code_lines_suggested || 0),
                    color: '#007ACC'
                  },
                  {
                    name: 'Accepted',
                    y: language.total_code_acceptances || 0,
                    color: '#4CAF50'
                  },
                  {
                    name: 'LoC Suggested',
                    y: language.total_code_lines_suggested,
                    color: '#FFC107'
                  },
                  {
                    name: 'LoC Accepted',
                    y: language.total_code_lines_accepted,
                    color: '#FF5722'
                  }
                ],
                tooltip: {
                  headerFormat: '',
                  pointFormatter: function () {
                    return `<b>${this.name}</b>: ${this.y}`;
                  }
                }
              });
            });
          });
        });
      }

      // Chat drilldown (Editor level)
      drilldownSeries.push({
        type: 'column',
        name: 'IDE Chat',
        id: `chat_${dateData.date}`,
        data: dateData.copilot_ide_chat?.editors?.map((editor) => ({
          name: editor.name,
          y: editor.total_engaged_users,
          drilldown: `chat_${editor.name}_${dateData.date}`,
          color: this.getEditorColor(editor.name.split('/')[0]),
          customTooltipInfo: () => customTooltipInfo.copilot_ide_chat(editor)
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
            drilldown: `chat_${editor.name}_${model.name}_${dateData.date}`,
            customTooltipInfo: () => customTooltipInfo.copilot_ide_chat(model)
          })).sort((a, b) => b.y - a.y)
        });
        (editor.models as ChatModel[]).forEach((model) => {
          drilldownSeries.push({
            type: 'column',
            name: `${model.name} Suggestions`,
            id: `chat_${editor.name}_${model.name}_${dateData.date}`,
            data: [
              {
                name: 'Chats',
                y: model.total_chats,
                color: '#007ACC'
              },
              {
                name: 'Copys',
                y: (model.total_chat_copy_events || 0),
                color: '#4CAF50'
              },
              {
                name: 'Inertions',
                y: model.total_chat_insertion_events || 0,
                color: '#FFC107'
              }
            ],
            tooltip: {
              headerFormat: '',
              pointFormatter: function () {
                return `<b>${this.name}</b>: ${this.y}`;
              }
            }
          });
        });
      });

      // GitHub.com Chat drilldown (Model level)
      if (dateData.copilot_dotcom_chat) {
        drilldownSeries.push({
          type: 'column',
          name: 'GitHub.com Chat',
          id: `dotcom_chat_${dateData.date}`,
          data: dateData.copilot_dotcom_chat.models?.map((model) => ({
            name: model.name,
            y: model.total_engaged_users,
            drilldown: `dotcom_chat_${model.name}_${dateData.date}`,
            customTooltipInfo: () => customTooltipInfo.copilot_dotcom_chat(model)
          })).sort((a, b) => b.y - a.y) || []
        });
        dateData.copilot_dotcom_chat.models?.forEach((model) => {
          drilldownSeries.push({
            type: 'column',
            name: `${model.name} Suggestions`,
            id: `dotcom_chat_${model.name}_${dateData.date}`,
            data: [
              {
                name: 'Chats',
                y: model.total_chats,
                color: '#007ACC'
              }
            ],
            tooltip: {
              headerFormat: '',
              pointFormatter: function () {
                return `<b>${this.name}</b>: ${this.y}`;
              }
            }
          });
        });
      }

      // PR drilldown (Repo level)
      drilldownSeries.push({
        type: 'column',
        name: 'Pull Requests',
        id: `pr_${dateData.date}`,
        data: dateData.copilot_dotcom_pull_requests?.repositories?.map((repo) => ({
          name: repo.name || 'Unknown',
          y: repo.total_engaged_users,
          drilldown: `pr_${repo.name}_${dateData.date}`,
          customTooltipInfo: () => customTooltipInfo.copilot_dotcom_pull_requests(repo)
        })).sort((a, b) => b.y - a.y)
      });

      // PR models drilldown
      dateData.copilot_dotcom_pull_requests?.repositories?.forEach((repo) => {
        drilldownSeries.push({
          type: 'column',
          name: `${repo.name || 'Unknown'} Models`,
          id: `pr_${repo.name}_${dateData.date}`,
          data: repo.models.map((model) => ({
            name: model.name,
            y: model.total_engaged_users,
            drilldown: `pr_${repo.name}_${model.name}_${dateData.date}`,
            customTooltipInfo: () => customTooltipInfo.copilot_dotcom_pull_requests(model)
          })).sort((a, b) => b.y - a.y)
        });
        (repo.models).forEach((model) => {
          drilldownSeries.push({
            type: 'column',
            name: `${model.name} Suggestions`,
            id: `pr_${repo.name}_${model.name}_${dateData.date}`,
            data: [
              {
                name: 'Created Summaries',
                y: model.total_pr_summaries_created,
                color: '#007ACC'
              }
            ],
            tooltip: {
              headerFormat: '',
              pointFormatter: function () {
                return `<b>${this.name}</b>: ${this.y}`;
              }
            }
          });
        });
      });
    });

    return {
      time: {
        useUTC: true
      },
      chart: {
        events: {
          drilldown: this.drilldownIfSinglePoint()
        }
      },
      plotOptions: {
        column: {
          stacking: 'normal'
        }
      },
      series: [ideCompletionsSeries, ideChatSeries, dotcomChatSeries, prSeries],
      drilldown: {
        series: drilldownSeries
      },
      tooltip: {
        headerFormat: '<span><b>{series.name}</b></span><br>',
        pointFormatter: function (this: CustomHighchartsPoint) {
          const formatted = this.date ? this.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : this.name;
          const parts = [
            `<span style="color:${this.color}">${formatted}</span>: <b>${this.y}</b> users<br/>`
          ]
          if (this.customTooltipInfo) parts.push(this.customTooltipInfo());
          return parts.join('');
        }
      }
    };
  }

  getLanguageTrendsChart(metrics: CopilotMetrics[]): Highcharts.Options {
    const dailyData: Record<string, Record<string, { accepted: number, suggested: number }>> = {};
    const languageTotals: Record<string, number> = {};

    for (const entry of metrics) {
      const dateStr = new Date(entry.date).toISOString().split('T')[0];

      if (!entry.copilot_ide_code_completions?.editors) continue;

      for (const editor of entry.copilot_ide_code_completions.editors) {
        for (const model of editor.models || []) {
          for (const lang of model.languages || []) {
            if (!dailyData[dateStr]) dailyData[dateStr] = {};
            if (!dailyData[dateStr][lang.name]) {
              dailyData[dateStr][lang.name] = { accepted: 0, suggested: 0 };
            }

            dailyData[dateStr][lang.name].accepted += lang.total_code_lines_accepted || 0;
            dailyData[dateStr][lang.name].suggested += lang.total_code_lines_suggested || 0;

            languageTotals[lang.name] = (languageTotals[lang.name] || 0) + lang.total_code_lines_suggested;
          }
        }
      }
    }

    const topLanguages = Object.entries(languageTotals)
      .filter(([lang]) => lang.toLowerCase() !== 'unknown') // exclude "unknown"
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    const series: Highcharts.SeriesSplineOptions[] = topLanguages.map((lang: string) => ({
      name: lang,
      type: 'spline',
      color: this.getLanguageColor(lang),
      data: Object.entries(dailyData).map(([date, langs]) => {
        const accepted = langs[lang]?.accepted || 0;
        const suggested = langs[lang]?.suggested || 0;
        const percent = suggested > 0 ? (accepted / suggested) * 100 : null;

        return {
          x: new Date(date).getTime(),
          y: percent,
          custom: { accepted, suggested }
        };
      }).filter(p => p.y !== null)
    }));

    return {
      chart: { type: 'spline' },
      xAxis: { type: 'datetime' },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: 'Acceptance Rate (%)' }
      },
      tooltip: {
        formatter: function (this: Highcharts.TooltipFormatterContextObject & {
          point: Highcharts.Point & { custom?: { accepted: number, suggested: number } }
        }) {
          return `
            <b>${this.series.name}</b><br/>
            ${Highcharts.dateFormat('%b %e', this.x as number)}<br/>
            Accepted: ${this.point.custom?.accepted}<br/>
            Suggested: ${this.point.custom?.suggested}<br/>
            Acceptance: ${(this.y ?? 0).toFixed(1)}%
          `;
        }
      },
      series
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
        radius: 3,
        symbol: 'circle'
      },
      states: {
        hover: {
          lineWidth: 3
        }
      }
    };
    const dateTimes = Object.keys(data);
    const isDaily = Math.abs(new Date(dateTimes[1]).getTime() - new Date(dateTimes[0]).getTime()) > 3600000;
    const dateFormat = isDaily ? undefined : 'short';
    return {
      series: [activeUsersSeries],
      tooltip: {
        pointFormatter: (function () {
          const parts = [
            `<b>${new DatePipe('en-US').transform(this.x, dateFormat)}</b><br/>`,
            `${this.series.name}: `,
            `<b>${this.raw}</b>`,
            `(<b>${this.y?.toFixed(1)}%</b>)`
          ]
          return parts.join('');
        }) as Highcharts.FormatterCallbackFunction<CustomHighchartsPoint>
      }
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
        radius: 3,
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
      name: 'IDE Suggestions',
      data: [] as CustomHighchartsPointOptions[]
    };
    const dailyActiveIdeAcceptsSeries = {
      ...initialSeries,
      name: 'IDE Accepts',
      data: [] as CustomHighchartsPointOptions[]
    };
    const dailyActiveIdeChatSeries = {
      ...initialSeries,
      name: 'IDE Chats',
      data: [] as CustomHighchartsPointOptions[]
    };
    const dailyActiveDotcomChatSeries = {
      ...initialSeries,
      name: '.COM Chats',
      data: [] as CustomHighchartsPointOptions[]
    };
    const dailyActiveDotcomPrSeries = {
      ...initialSeries,
      name: '.COM Pull Requests',
      data: [] as CustomHighchartsPointOptions[]
    };

    Object.entries(activity).forEach(([date, dateData]) => {
      const currentMetrics = metrics.find(m => m.date.startsWith(date.slice(0, 10)));
      if (currentMetrics?.copilot_ide_code_completions) {
        (dailyActiveIdeCompletionsSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_ide_code_completions.total_code_suggestions / (dateData.totalActive || 1)),
          raw: date
        });

        if (dailyActiveIdeAcceptsSeries && dailyActiveIdeAcceptsSeries.data) {
          dailyActiveIdeAcceptsSeries.data.push({
            x: new Date(date).getTime(),
            y: (currentMetrics.copilot_ide_code_completions.total_code_acceptances / (dateData.totalActive || 1)),
            raw: date
          });
        }
      }
      if (currentMetrics?.copilot_ide_chat) {
        (dailyActiveIdeChatSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_ide_chat.total_chats / dateData.totalActive || 1),
          raw: date
        });
      }
      if (currentMetrics?.copilot_dotcom_chat) {
        (dailyActiveDotcomChatSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_dotcom_chat.total_chats / dateData.totalActive || 1),
          raw: date
        });
      }
      if (currentMetrics?.copilot_dotcom_pull_requests) {
        (dailyActiveDotcomPrSeries.data).push({
          x: new Date(date).getTime(),
          y: (currentMetrics.copilot_dotcom_pull_requests.total_pr_summaries_created / dateData.totalActive || 1),
          raw: date
        });
      }
    });

    return {
      series: [
        dailyActiveIdeCompletionsSeries,
        dailyActiveIdeAcceptsSeries,
        dailyActiveIdeChatSeries,
        dailyActiveDotcomChatSeries,
        // dailyActiveDotcomPrSeries,
      ]
    }
  }

  transformSurveysToScatter(surveys: Survey[], activity?: ActivityResponse): Highcharts.Options {
    surveys = surveys.filter(survey => survey.status !== 'pending');
    if (!activity) return { series: [] };

    const surveyAverages = Object.keys(activity).reduce((acc, activityDate) => {
      const dateKey = activityDate.split('T')[0];
      acc[dateKey] = {
        sum: 0,
        count: 0
      };

      const dateSurveys = surveys.filter(survey =>
        new Date(survey.createdAt!).toISOString().split('T')[0] === dateKey
      );

      if (dateSurveys.length > 0) {
        const avgPercentTimeSaved = dateSurveys.reduce((sum, survey) => sum + survey.percentTimeSaved, 0)
        acc[dateKey].sum = avgPercentTimeSaved * 0.01 * 0.3 * 40; // TODO pull settings
        acc[dateKey].count = dateSurveys.length;
      }

      return acc;
    }, {} as Record<string, { sum: number; count: number }>);


    // Generate series with 7-day rolling average
    const seriesData = Object.keys(activity)
      .map(activityDate => ({
        x: new Date(activityDate).getTime(),
        y: ((targetDate: string, surveyAverages: Record<string, { sum: number; count: number }>) => {
          const target = new Date(targetDate);
          const sevenDaysAgo = new Date(target);
          sevenDaysAgo.setDate(target.getDate() - 6); // -6 to include current day

          let totalSum = 0;
          let totalCount = 0;

          // Loop through last 7 days
          for (let d = new Date(sevenDaysAgo); d <= target; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            if (surveyAverages[key]) {
              totalSum += surveyAverages[key].sum;
              totalCount += surveyAverages[key].count;
            }
          }

          return totalCount > 0 ? totalSum / totalCount : 0;
        })(activityDate, surveyAverages)
      }))
      .sort((a, b) => a.x - b.x);

    return {
      series: [
        {
          name: 'Time Saved',
          type: 'spline' as const,
          data: seriesData,
          lineWidth: 2,
          marker: {
            enabled: true,
            radius: 3,
            symbol: 'circle'
          },
          states: {
            hover: {
              lineWidth: 3
            }
          }
        },
        // {
        //   type: 'scatter' as const,
        //   name: 'Survey',
        //   data: surveys.map(survey => ({
        //     x: new Date(survey.createdAt!).getTime(),
        //     y: survey.percentTimeSaved,
        //     raw: survey
        //   })),
        //   marker: {
        //     enabled: true,
        //     radius: 3,
        //     symbol: 'triangle',
        //   },
        //   tooltip: {
        //     headerFormat: '<b>{point.x:%b %d, %Y}</b><br/>',
        //     pointFormatter: function () {
        //       return [
        //         `User: `,
        //         '<b>' + this.raw?.userId + '</b>',
        //         `</br>Time saved: `,
        //         '<b>' + Math.round(this.y || 0) + '%</b>',
        //         `</br>PR: `,
        //         '<b>#' + this.raw?.prNumber + '</b>',
        //       ].join('');
        //     } as Highcharts.FormatterCallbackFunction<CustomHighchartsPoint>
        //   }
        // }
      ]
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
      return this.getEditorColor(seat.last_activity_editor?.split('/')[0] || 'unknown');
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

          // Skip if same activity timestamp as previous (no new activity)
          if (
            lastSeatActivity?.last_activity_at === seat.last_activity_at &&
            lastSeatActivity?.last_activity_editor === seat.last_activity_editor
          ) {
            return acc;
          }

          const activityStartTime = new Date(Date.parse(seat.last_activity_at || seat.created_at));
          const activityEndTime = new Date(Date.parse(seatActivity[index + 1]?.last_activity_at || seatActivity[index + 1]?.created_at));
          if (activityEndTime.getTime() === activityStartTime.getTime()) {
            activityEndTime.setHours(activityEndTime.getHours() + 1);
          }
          acc.push({
            name: String(seat.assignee?.login || `Seat ${seat.assignee?.id}`),
            start: activityStartTime.getTime(),
            end: index < seatActivity.length - 1 ? activityEndTime.getTime() : activityStartTime.getTime() + (60 * 60 * 1000),
            y: getEditorIndex(seat),
            color: getEditorColor(seat),
            raw: seat,
          });

          return acc;
        }, [] as CustomHighchartsGanttPoint[]),
      }] as Highcharts.SeriesGanttOptions[],
      tooltip: {
        formatter: function () {
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
        //min: new Date().getTime(),
        min: new Date(seatActivity[0].last_activity_at || seatActivity[0].created_at).getTime(),
        max: new Date().getTime(),
      },
      yAxis: {
        type: 'category',
        categories: Object.keys(editorGroups).map(editor => editor.toLowerCase()),
      }
    };
  }

  transformMetricsToPieDrilldown(metrics: CopilotMetrics): Highcharts.Options {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedSeriesOptions: any = {
      colorByPoint: true,
      innerSize: '40%',
    };
    const suggestionsSeries: Highcharts.SeriesOptionsType = {
      type: 'pie' as const,
      name: 'Copilot Usage',
      data: metrics.copilot_ide_code_completions?.editors.map(editor => ({
        name: editor.name,
        y: editor.total_code_suggestions,
        raw: editor,
        drilldown: `editor_${editor.name}`,
        color: this.getEditorColor(editor.name.split('/')[0])
      })),
      dataLabels: [{
        enabled: true,
        distance: 20
      }, {
        enabled: true,
        distance: -40,
        format: '{point.percentage:.1f}%',
        filter: {
          operator: '>',
          property: 'percentage',
          value: 10
        }
      }],
      ...sharedSeriesOptions
    };

    const drilldownSeries: Highcharts.SeriesOptionsType[] = [];

    // IDE Completions drilldown by editor 🖥️
    if (metrics.copilot_ide_code_completions?.editors) {
      metrics.copilot_ide_code_completions.editors.forEach(editor => {
        drilldownSeries.push({
          type: 'pie',
          name: editor.name,
          id: `editor_${editor.name}`,
          data: editor.models.map(model => ({
            name: model.name,
            y: (model as CodeModel).total_code_suggestions,
            raw: model,
            drilldown: `model_${editor.name}_${model.name}`
          })),
          ...sharedSeriesOptions
        });

        editor.models.forEach(model => {
          if ('languages' in model) {
            drilldownSeries.push({
              type: 'pie',
              name: `${model.name} Languages`,
              id: `model_${editor.name}_${model.name}`,
              data: model.languages.map(lang => ({
                name: lang.name,
                y: lang.total_code_suggestions,
                raw: lang,
                drilldown: `lang_${editor.name}_${model.name}_${lang.name}`,
                color: this.getLanguageColor(lang.name),
              })),
              ...sharedSeriesOptions
            });

            model.languages.forEach(lang => {
              drilldownSeries.push({
                type: 'pie',
                name: `${lang.name} Details`,
                id: `lang_${editor.name}_${model.name}_${lang.name}`,
                data: [
                  {
                    name: 'Accepted',
                    y: lang.total_code_acceptances,
                    raw: lang,
                    color: '#4CAF50'
                  },
                  {
                    name: 'Ignored',
                    y: (lang.total_code_suggestions || 0) - (lang.total_code_acceptances || 0),
                    raw: lang,
                    color: '#757575'
                  }
                ] as CustomHighchartsPoint[],
                ...sharedSeriesOptions
              });
            });
          }
        });
      });
    }

    return {
      chart: {
        events: {
          drilldown: this.drilldownIfSinglePoint()
        }
      },
      series: [suggestionsSeries],
      drilldown: {
        series: drilldownSeries,
      },
      tooltip: {
        headerFormat: undefined,
        pointFormatter: function () {
          const decimalPipe = new DecimalPipe('en-US');
          const parts = [
            `<b>${this.name}</b><br>`,
            `Suggestions: <b>${decimalPipe.transform(this.y)}</b><br>`,
            `Accepted: <b>${decimalPipe.transform(this.raw.total_code_acceptances)} (${decimalPipe.transform(this.raw.total_code_acceptances / this.raw.total_code_suggestions * 100, '1.2-2')}%)</b><br>`,
            `LoC Suggested: <b>${decimalPipe.transform(this.raw.total_code_lines_suggested)}</b><br>`,
            `LoC Accepted: <b>${decimalPipe.transform(this.raw.total_code_lines_accepted)}</b><br>`
          ];
          return parts.join('');
        } as Highcharts.FormatterCallbackFunction<CustomHighchartsPoint>
      }
    };
  }

  getEditorColor(editor: string): string | undefined {
    return ({
      'visualstudio': '#5C2D91',
      'vscode': '#007ACC',
      'jetbrains': '#FF6B6B',
      'xcode': '#157EFB',
      'neovim': '#57A143',
      'emacs': '#7F5AB6',
      'vim': '#019733',
      'unknown': '#808080'
    })[editor.toLowerCase()];
  }

  getLanguageColor(language: string): string | undefined {
    const colorMap: Record<string, string> = {
      // Programming Languages
      'typescript': '#3178c6',
      'javascript': '#f1e05a',
      'python': '#3572A5',
      'java': '#b07219',
      'csharp': '#178600',
      'cpp': '#f34b7d',
      'fsharp': '#b845fc',
      'ruby': '#701516',
      'go': '#00ADD8',
      'rust': '#dea584',
      'swift': '#F05138',
      'kotlin': '#A97BFF',
      'dart': '#00B4AB',
      'elixir': '#6e4a7e',
      'lua': '#000080',
      'perl': '#0298c3',
      'scala': '#c22d40',
      'groovy': '#4298b8',
      'clojure': '#db5855',
      'julia': '#a270ba',

      // Markup & Config
      'html': '#e34c26',
      'css': '#563d7c',
      'scss': '#c6538c',
      'markdown': '#083fa1',
      'yaml': '#cb171e',
      'xml': '#0060ac',
      'json': '#292929',
      'jsonc': '#292929',
      'toml': '#9c4221',
      'dockerfile': '#384d54',
      'makefile': '#427819',

      // Framework Specific
      'typescriptreact': '#3178c6',
      'javascriptreact': '#f1e05a',
      'vue': '#41b883',
      'svelte': '#ff3e00',
      'razor': '#512be4',
      'blade': '#f7523f',

      // Other
      'sql': '#e38c00',
      'graphql': '#e10098',
      'powershell': '#012456',
      'shellscript': '#89e051',
      'bat': '#C1F12E',
      'ini': '#d1dbe0',
      'plaintext': '#777777',
      'ignore': '#666666',
      'gitattributes': '#F44D27'
    };

    return colorMap[language.toLowerCase()]
  }

  drilldownIfSinglePoint(): Highcharts.DrilldownCallbackFunction {
    return function (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((e.seriesOptions as any)?.data.length === 1) {
        setTimeout(() => {
          const point = this.series[0].points[0];
          if (point && point.doDrilldown) {
            point.doDrilldown();
          }
        }, 0);
      }
    }
  }
}
