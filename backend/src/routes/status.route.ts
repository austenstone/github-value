import express from 'express';
import StatusService from '../services/status.service.js';
import logger from '../services/logger.js';

const router = express.Router();
const statusService = new StatusService();

router.get('/', async (req, res) => {
  try {
    // Pass the request object to getStatus
    const status = await statusService.getStatus(req);
    res.json(status);
  } catch (error) {
    logger.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
