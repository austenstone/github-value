import { BaseError, Includeable, Op } from "sequelize";
import logger from "./logger.js";
import { MetricDaily, MetricDailyResponseType, MetricDotcomChatMetrics, MetricDotcomChatModelStats, MetricEditor, MetricIdeChatEditor, MetricIdeChatMetrics, MetricIdeChatModelStats, MetricIdeCompletions, MetricLanguageStats, MetricModelStats, MetricPrMetrics, MetricPrModelStats, MetricPrRepository } from "../models/metrics.model.js";

export interface MetricsQueryParams {
  type?: string,
  since?: string,
  until?: string,
  editor?: string,
  language?: string,
  model?: string
  org?: string
};

class MetricsService {
  async getMetrics(params: MetricsQueryParams) {
    const { org, type, since, until, editor, language, model } = params;
    // consider the fact that these are UTC dates...
    const dateFilter = {
      ...(since && { [Op.gte]: new Date(since as string) }),
      ...(until && { [Op.lte]: new Date(until as string) })
    };
    const where = {
      ...(org ? { org } : {}),
      ...Object.getOwnPropertySymbols(dateFilter).length ? { date: dateFilter } : {}
    }

    const types = type ? (type as string).split(/[ ,]+/) : [];
    const include = [] as Includeable[];
    if (types.length === 0 || types.includes('copilot_ide_code_completions')) {
      include.push({
        attributes: { exclude: ['id', 'daily_metric_id'] },
        model: MetricIdeCompletions,
        as: 'copilot_ide_code_completions',
        include: [{
          attributes: { exclude: ['id', 'ide_completion_id'] },
          model: MetricEditor,
          as: 'editors',
          where: editor ? { name: editor } : {},
          required: true,
          include: [{
            attributes: { exclude: ['id', 'editor_id'] },
            model: MetricModelStats,
            as: 'models',
            where: model ? { name: model } : {},
            required: true,
            include: [{
              attributes: { exclude: ['id', 'model_stat_id'] },
              model: MetricLanguageStats,
              as: 'languages',
              where: language ? { name: language } : {},
              required: true,
            }]
          }]
        }]
      });
    }
    if (types.length === 0 || types.includes('copilot_ide_chat')) {
      include.push({
        attributes: { exclude: ['id', 'daily_metric_id'] },
        model: MetricIdeChatMetrics,
        as: 'copilot_ide_chat',
        required: true,
        include: [{
          separate: true,
          attributes: { exclude: ['id', 'chat_metrics_id'] },
          model: MetricIdeChatEditor,
          as: 'editors',
          where: editor ? { name: editor } : {},
          required: true,
          include: [{
            attributes: { exclude: ['id', 'editor_id'] },
            model: MetricIdeChatModelStats,
            as: 'models',
            where: model ? { name: model } : {},
            required: true,
          }]
        }]
      });
    }
    if (types.length === 0 || types.includes('copilot_dotcom_chat')) {
      include.push({
        attributes: { exclude: ['id', 'daily_metric_id'] },
        model: MetricDotcomChatMetrics,
        as: 'copilot_dotcom_chat',
        include: [{
          attributes: { exclude: ['id', 'chat_metrics_id'] },
          model: MetricDotcomChatModelStats,
          as: 'models',
          where: model ? { name: model } : {},
          required: false,
        }]
      })
    }
    if (types.length === 0 || types.includes('copilot_dotcom_pull_requests')) {
      include.push({
        attributes: { exclude: ['id', 'daily_metric_id'] },
        model: MetricPrMetrics,
        as: 'copilot_dotcom_pull_requests',
        include: [{
          attributes: { exclude: ['id', 'pr_metrics_id'] },
          model: MetricPrRepository,
          as: 'repositories',
          include: [{
            attributes: { exclude: ['id', 'repository_id'] },
            model: MetricPrModelStats,
            as: 'models',
            where: model ? { name: model } : {},
            required: false,
          }]
        }]
      });
    }

    const rsp = await MetricDaily.findAll({
      where,
      include
    })
    return rsp;
  }

  async getMetricsTotals(params: MetricsQueryParams) {
    const metrics = await this.getMetrics(params);

    // Initialize aggregated totals
    const periodMetrics = {
      since: metrics[0]?.date,
      until: metrics[metrics.length - 1]?.date,
      copilot_ide_code_completions: {
        total_code_acceptances: 0,
        total_code_suggestions: 0,
        total_code_lines_accepted: 0,
        total_code_lines_suggested: 0,
        editors: [] as {
          name: string,
          total_code_acceptances: number,
          total_code_suggestions: number,
          total_code_lines_accepted: number,
          total_code_lines_suggested: number,
          models: {
            name: string,
            total_code_acceptances: number,
            total_code_suggestions: number,
            total_code_lines_accepted: number,
            total_code_lines_suggested: number,
            languages: {
              name: string,
              total_code_acceptances: number,
              total_code_suggestions: number,
              total_code_lines_accepted: number,
              total_code_lines_suggested: number
            }[]
          }[]
        }[],
      },
      copilot_ide_chat: {
        total_chats: 0,
        total_chat_copy_events: 0,
        total_chat_insertion_events: 0,
        editors: [] as {
          name: string,
          total_chats: number,
          total_chat_copy_events: number,
          total_chat_insertion_events: number,
          models: {
            name: string,
            total_chats: number,
            total_chat_copy_events: number,
            total_chat_insertion_events: number
          }[]
        }[],
      },
      copilot_dotcom_chat: {
        total_chats: 0,
        models: [] as {
          name: string,
          total_chats: number
        }[],
      },
      copilot_dotcom_pull_requests: {
        total_pr_summaries_created: 0,
        repositories: [] as {
          name: string,
          total_pr_summaries_created: number,
          models: {
            name: string,
            total_pr_summaries_created: number
          }[]
        }[],
      }
    };

    metrics.forEach(daily => {
      if (daily.copilot_ide_code_completions) {
        periodMetrics.copilot_ide_code_completions.total_code_acceptances += daily.copilot_ide_code_completions.total_code_acceptances || 0;
        periodMetrics.copilot_ide_code_completions.total_code_suggestions += daily.copilot_ide_code_completions.total_code_suggestions || 0;
        periodMetrics.copilot_ide_code_completions.total_code_lines_accepted += daily.copilot_ide_code_completions.total_code_lines_accepted || 0;
        periodMetrics.copilot_ide_code_completions.total_code_lines_suggested += daily.copilot_ide_code_completions.total_code_lines_suggested || 0;
        daily.copilot_ide_code_completions.editors?.forEach(editor => {
          let editorTotals = periodMetrics.copilot_ide_code_completions.editors.find(e => e.name === editor.name);
          if (editorTotals) {
            editorTotals.total_code_acceptances += editor.total_code_acceptances || 0;
            editorTotals.total_code_suggestions += editor.total_code_suggestions || 0;
            editorTotals.total_code_lines_accepted += editor.total_code_lines_accepted || 0;
            editorTotals.total_code_lines_suggested += editor.total_code_lines_suggested || 0;
          } else {
            editorTotals = {
              name: editor.name,
              total_code_acceptances: editor.total_code_acceptances,
              total_code_suggestions: editor.total_code_suggestions,
              total_code_lines_accepted: editor.total_code_lines_accepted,
              total_code_lines_suggested: editor.total_code_lines_suggested,
              models: []
            }
            periodMetrics.copilot_ide_code_completions.editors.push(editorTotals);
          }
          editor.models?.forEach(model => {
            let editorModelTotals = editorTotals?.models.find(m => m.name === model.name);
            if (editorModelTotals) {
              editorModelTotals.total_code_acceptances += model.total_code_acceptances || 0;
              editorModelTotals.total_code_suggestions += model.total_code_suggestions || 0;
              editorModelTotals.total_code_lines_accepted += model.total_code_lines_accepted || 0;
              editorModelTotals.total_code_lines_suggested += model.total_code_lines_suggested || 0;
            } else {
              editorModelTotals = {
                name: model.name,
                total_code_acceptances: model.total_code_acceptances,
                total_code_suggestions: model.total_code_suggestions,
                total_code_lines_accepted: model.total_code_lines_accepted,
                total_code_lines_suggested: model.total_code_lines_suggested,
                languages: []
              }
              editorTotals?.models.push(editorModelTotals);
            }
            model.languages?.forEach(language => {
              let modelLanguageTotals = editorModelTotals?.languages.find(l => l.name === language.name);
              if (modelLanguageTotals) {
                modelLanguageTotals.total_code_acceptances += language.total_code_acceptances || 0;
                modelLanguageTotals.total_code_suggestions += language.total_code_suggestions || 0;
                modelLanguageTotals.total_code_lines_accepted += language.total_code_lines_accepted || 0;
                modelLanguageTotals.total_code_lines_suggested += language.total_code_lines_suggested || 0;
              } else {
                modelLanguageTotals = {
                  name: language.name,
                  total_code_acceptances: language.total_code_acceptances,
                  total_code_suggestions: language.total_code_suggestions,
                  total_code_lines_accepted: language.total_code_lines_accepted,
                  total_code_lines_suggested: language.total_code_lines_suggested
                }
                editorModelTotals?.languages.push(modelLanguageTotals);
              }
            });
          });
        });
      }

      if (daily.copilot_ide_chat) {
        periodMetrics.copilot_ide_chat.total_chats += daily.copilot_ide_chat.total_chats || 0;
        periodMetrics.copilot_ide_chat.total_chat_copy_events += daily.copilot_ide_chat.total_chat_copy_events || 0;
        periodMetrics.copilot_ide_chat.total_chat_insertion_events += daily.copilot_ide_chat.total_chat_insertion_events || 0;
        daily.copilot_ide_chat.editors?.forEach(editor => {
          let editorTotals = periodMetrics.copilot_ide_chat.editors.find(e => e.name === editor.name);
          if (editorTotals) {
            editorTotals.total_chats += editor.total_chats || 0;
            editorTotals.total_chat_copy_events += editor.total_chat_copy_events || 0;
            editorTotals.total_chat_insertion_events += editor.total_chat_insertion_events || 0;
          } else {
            editorTotals = {
              name: editor.name,
              total_chats: editor.total_chats,
              total_chat_copy_events: editor.total_chat_copy_events,
              total_chat_insertion_events: editor.total_chat_insertion_events,
              models: []
            }
            periodMetrics.copilot_ide_chat.editors.push(editorTotals);
          }
          editor.models?.forEach(model => {
            let editorModelTotals = editorTotals?.models.find(m => m.name === model.name);
            if (editorModelTotals) {
              editorModelTotals.total_chats += model.total_chats || 0;
              editorModelTotals.total_chat_copy_events += model.total_chat_copy_events || 0;
              editorModelTotals.total_chat_insertion_events += model.total_chat_insertion_events || 0;
            } else {
              editorModelTotals = {
                name: model.name,
                total_chats: model.total_chats,
                total_chat_copy_events: model.total_chat_copy_events,
                total_chat_insertion_events: model.total_chat_insertion_events
              }
              editorTotals?.models.push(editorModelTotals);
            }
          });
        });
      }

      if (daily.copilot_dotcom_chat) {
        periodMetrics.copilot_dotcom_chat.total_chats += daily.copilot_dotcom_chat.total_chats || 0;
        daily.copilot_dotcom_chat.models?.forEach(model => {
          let modelTotals = periodMetrics.copilot_dotcom_chat.models.find(m => m.name === model.name);
          if (modelTotals) {
            modelTotals.total_chats += model.total_chats || 0;
          } else {
            modelTotals = {
              name: model.name,
              total_chats: model.total_chats
            }
            periodMetrics.copilot_dotcom_chat.models.push(modelTotals);
          }
        });
      }

      if (daily.copilot_dotcom_pull_requests) {
        periodMetrics.copilot_dotcom_pull_requests.total_pr_summaries_created += daily.copilot_dotcom_pull_requests.total_pr_summaries_created || 0;
        daily.copilot_dotcom_pull_requests.repositories?.forEach(repository => {
          let repositoryTotals = periodMetrics.copilot_dotcom_pull_requests.repositories.find(r => r.name === repository.name);
          if (repositoryTotals) {
            repositoryTotals.total_pr_summaries_created += repository.total_pr_summaries_created || 0;
          } else {
            repositoryTotals = {
              name: repository.name,
              total_pr_summaries_created: repository.total_pr_summaries_created,
              models: []
            }
            periodMetrics.copilot_dotcom_pull_requests.repositories.push(repositoryTotals);
          }
          repository.models?.forEach(model => {
            const repositoryModelTotals = repositoryTotals?.models.find(m => m.name === model.name);
            if (repositoryModelTotals) {
              repositoryModelTotals.total_pr_summaries_created += model.total_pr_summaries_created || 0;
            } else {
              repositoryTotals?.models.push({
                name: model.name,
                total_pr_summaries_created: model.total_pr_summaries_created
              });
            }
          });
        });
      }
    });

    return periodMetrics;
  }

  async insertMetrics(org: string, data: MetricDailyResponseType[], team?: string) {
    const where = {
      org: org,
      ...team ? { team } : undefined,
    }
    for (const day of data) {
      const parts = day.date.split('-').map(Number);
      const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
      let metric: MetricDaily;
      try {
        await MetricDaily.upsert({
          ...where,
          date: date,
          total_active_users: day.total_active_users,
          total_engaged_users: day.total_engaged_users,
        });
        const _metric = await MetricDaily.findOne({
          where: {
            ...where,
            date: date,
          }
        })
        if (!_metric) throw new Error('Metric not found');
        metric = _metric;
        logger.debug(`Metrics for ${day.date} inserted successfully`);
      } catch (error) {
        if (error instanceof BaseError && error.name === 'SequelizeUniqueConstraintError') {
          logger.debug(`Metrics for ${day.date} already exist. Skipping... ⏭️`);
        } else {
          logger.error(error);
        }
        continue;
      }

      if (day.copilot_ide_chat) {
        const chatTotals = {
          chats: 0,
          copyEvents: 0,
          insertionEvents: 0
        };

        const chatMetrics = await MetricIdeChatMetrics.create({
          daily_metric_id: metric.date,
          total_engaged_users: day.copilot_ide_chat.total_engaged_users,
          total_chats: 0,
          total_chat_copy_events: 0,
          total_chat_insertion_events: 0
        });

        if (day.copilot_ide_chat.editors) {
          for (const editor of day.copilot_ide_chat.editors) {
            const chatTotalsEditor = { chats: 0, copyEvents: 0, insertionEvents: 0 };

            const editorRecord = await MetricIdeChatEditor.create({
              chat_metrics_id: (chatMetrics.id || -1),
              name: editor.name,
              total_engaged_users: editor.total_engaged_users,
              total_chats: 0,
              total_chat_copy_events: 0,
              total_chat_insertion_events: 0,
            });

            if (editor.models) {
              for (const model of editor.models) {
                chatTotalsEditor.chats += model.total_chats;
                chatTotalsEditor.copyEvents += model.total_chat_copy_events || 0;
                chatTotalsEditor.insertionEvents += model.total_chat_insertion_events || 0;

                // Add to overall totals
                chatTotals.chats += model.total_chats;
                chatTotals.copyEvents += model.total_chat_copy_events || 0;
                chatTotals.insertionEvents += model.total_chat_insertion_events || 0;

                await MetricIdeChatModelStats.create({
                  editor_id: editorRecord.id,
                  name: model.name,
                  is_custom_model: model.is_custom_model,
                  total_engaged_users: model.total_engaged_users,
                  total_chats: model.total_chats,
                  total_chat_copy_events: model.total_chat_copy_events || 0,
                  total_chat_insertion_events: model.total_chat_insertion_events || 0
                });
              }
            }

            await editorRecord.update({
              total_chats: chatTotalsEditor.chats,
              total_chat_copy_events: chatTotalsEditor.copyEvents,
              total_chat_insertion_events: chatTotalsEditor.insertionEvents
            });
          }
        }

        await chatMetrics.update({
          total_chats: chatTotals.chats,
          total_chat_copy_events: chatTotals.copyEvents,
          total_chat_insertion_events: chatTotals.insertionEvents
        });
      }

      if (day.copilot_ide_code_completions) {
        const completions = await MetricIdeCompletions.create({
          total_engaged_users: day.copilot_ide_code_completions.total_engaged_users,
          daily_metric_id: metric.date,
          total_code_acceptances: 0,
          total_code_suggestions: 0,
          total_code_lines_accepted: 0,
          total_code_lines_suggested: 0
        });

        const dailyTotals = { acceptances: 0, suggestions: 0, linesAccepted: 0, linesSuggested: 0 };

        if (day.copilot_ide_code_completions.editors) {
          for (const editor of day.copilot_ide_code_completions.editors) {
            const editorRecord = await MetricEditor.create({
              name: editor.name,
              total_engaged_users: editor.total_engaged_users,
              ide_completion_id: completions.id || -1,
              total_code_acceptances: 0,
              total_code_suggestions: 0,
              total_code_lines_accepted: 0,
              total_code_lines_suggested: 0
            });

            const editorTotals = { acceptances: 0, suggestions: 0, linesAccepted: 0, linesSuggested: 0 };

            if (editor.models) {
              for (const model of editor.models) {
                const modelRecord = await MetricModelStats.create({
                  name: model.name,
                  is_custom_model: model.is_custom_model,
                  total_engaged_users: model.total_engaged_users,
                  editor_id: editorRecord.id || -1,
                  total_code_acceptances: 0,
                  total_code_suggestions: 0,
                  total_code_lines_accepted: 0,
                  total_code_lines_suggested: 0
                });

                const modelTotals = { acceptances: 0, suggestions: 0, linesAccepted: 0, linesSuggested: 0 };

                if (model.languages) {
                  for (const lang of model.languages) {
                    await MetricLanguageStats.create({
                      name: lang.name,
                      total_engaged_users: lang.total_engaged_users,
                      total_code_acceptances: lang.total_code_acceptances || 0,
                      total_code_suggestions: lang.total_code_suggestions || 0,
                      total_code_lines_accepted: lang.total_code_lines_accepted || 0,
                      total_code_lines_suggested: lang.total_code_lines_suggested || 0,
                      model_stat_id: modelRecord.id
                    });

                    modelTotals.acceptances += lang.total_code_acceptances || 0;
                    modelTotals.suggestions += lang.total_code_suggestions || 0;
                    modelTotals.linesAccepted += lang.total_code_lines_accepted || 0;
                    modelTotals.linesSuggested += lang.total_code_lines_suggested || 0;
                  }
                }

                await modelRecord.update({
                  total_code_acceptances: modelTotals.acceptances,
                  total_code_suggestions: modelTotals.suggestions,
                  total_code_lines_accepted: modelTotals.linesAccepted,
                  total_code_lines_suggested: modelTotals.linesSuggested
                });

                editorTotals.acceptances += modelTotals.acceptances;
                editorTotals.suggestions += modelTotals.suggestions;
                editorTotals.linesAccepted += modelTotals.linesAccepted;
                editorTotals.linesSuggested += modelTotals.linesSuggested;
              }
            }

            await editorRecord.update({
              total_code_acceptances: editorTotals.acceptances,
              total_code_suggestions: editorTotals.suggestions,
              total_code_lines_accepted: editorTotals.linesAccepted,
              total_code_lines_suggested: editorTotals.linesSuggested
            });

            dailyTotals.acceptances += editorTotals.acceptances;
            dailyTotals.suggestions += editorTotals.suggestions;
            dailyTotals.linesAccepted += editorTotals.linesAccepted;
            dailyTotals.linesSuggested += editorTotals.linesSuggested;
          }
        }

        await completions.update({
          total_code_acceptances: dailyTotals.acceptances,
          total_code_suggestions: dailyTotals.suggestions,
          total_code_lines_accepted: dailyTotals.linesAccepted,
          total_code_lines_suggested: dailyTotals.linesSuggested
        });
      }

      if (day.copilot_dotcom_pull_requests) {
        let totalPrSummaries = 0;
        const prMetrics = await MetricPrMetrics.create({
          daily_metric_id: metric.date,
          total_engaged_users: day.copilot_dotcom_pull_requests.total_engaged_users,
          total_pr_summaries_created: 0
        });

        if (day.copilot_dotcom_pull_requests.repositories) {
          for (const repo of day.copilot_dotcom_pull_requests.repositories) {
            let totalPrSummariesRepo = 0;
            const repository = await MetricPrRepository.create({
              pr_metrics_id: prMetrics.id,
              name: repo.name,
              total_engaged_users: repo.total_engaged_users,
              total_pr_summaries_created: 0
            });

            if (repo.models) {
              repo.models.map(async (model) => {
                totalPrSummaries += model.total_pr_summaries_created || 0; totalPrSummariesRepo += model.total_pr_summaries_created || 0;

                await MetricPrModelStats.create({
                  repository_id: repository.id,
                  name: model.name,
                  is_custom_model: model.is_custom_model,
                  total_engaged_users: model.total_engaged_users,
                  total_pr_summaries_created: model.total_pr_summaries_created
                })
              });
            }
            repository.update({
              total_pr_summaries_created: totalPrSummariesRepo
            });
          }
        }

        await prMetrics.update({
          total_pr_summaries_created: totalPrSummaries
        });
      }

      if (day.copilot_dotcom_chat) {
        let totalChats = 0;
        const chatMetrics = await MetricDotcomChatMetrics.create({
          daily_metric_id: metric.date,
          total_engaged_users: day.copilot_dotcom_chat.total_engaged_users,
          total_chats: 0
        });

        if (day.copilot_dotcom_chat.models) {
          day.copilot_dotcom_chat.models.map(async (model) => {
            totalChats += model.total_chats || 0;
            await MetricDotcomChatModelStats.create({
              chat_metrics_id: chatMetrics.id,
              name: model.name,
              is_custom_model: model.is_custom_model,
              total_engaged_users: model.total_engaged_users,
              total_chats: model.total_chats
            })
          });
        }

        await chatMetrics.update({
          total_chats: totalChats
        });
      }
    }
  }

}

export default new MetricsService();