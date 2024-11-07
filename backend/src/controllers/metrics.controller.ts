import { Request, Response } from 'express';
<<<<<<< HEAD
import { MetricDaily, MetricDotcomChatMetrics, MetricDotcomChatModelStats, MetricEditor, MetricIdeChatEditor, MetricIdeChatMetrics, MetricIdeChatModelStats, MetricIdeCompletions, MetricLanguageStats, MetricModelStats, MetricPrMetrics, MetricPrModelStats, MetricPrRepository } from '../models/metrics.model';
import { Op } from 'sequelize';
=======
import { Metrics, Breakdown } from '../models/metrics.model.js';
>>>>>>> 518279f0bc3ac0923b7498bd46ecf4fa4794e860

class MetricsController {
  // Get all metrics 📊
  async getMetrics(req: Request, res: Response): Promise<void> {
    const { type, since, until, editor, language, model } = req.query;
    try {
      // consider the fact that these are UTC dates...
      const dateFilter: any = { };
      if (since) {
        dateFilter[Op.gte] = new Date(since as string);
      }
      if (until) {
        dateFilter[Op.lte] = new Date(until as string);
      }

      const include = [];
      const types = type ? (type as string).split(/[ ,]+/) : [];
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
            required: false,
            include: [{
              attributes: { exclude: ['id', 'editor_id'] },
              model: MetricModelStats,
              as: 'models',
              where: model ? { name: model } : {},
              required: false,
              include: [{
                attributes: { exclude: ['id', 'model_stat_id'] },
                model: MetricLanguageStats,
                as: 'languages',
                where: language ? { name: language } : {},
                required: false,
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
          include: [{
            attributes: { exclude: ['id', 'chat_metrics_id'] },
            model: MetricIdeChatEditor,
            as: 'editors',
            where: editor ? { name: editor } : {},
            required: false,
            include: [{
              attributes: { exclude: ['id', 'editor_id'] },
              model: MetricIdeChatModelStats,
              as: 'models',
              where: model ? { name: model } : {},
              required: false,
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
        });
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
      const metrics = await MetricDaily.findAll({
        where: Object.getOwnPropertySymbols(dateFilter).length ? { date: dateFilter } : {},
        include
      });
      res.status(200).json(metrics); // 🎉 All metrics retrieved!
    } catch (error) {
      console.log(error)
      res.status(500).json(error); // 🚨 Error handling
    }
  }
}

export default new MetricsController();