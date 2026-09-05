import express from 'express';
import { listIngestionRuns, triggerIngestion, getIngestionRun, cancelIngestionRun, getIngestionStatus } from '../controllers/ingestion.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/runs', listIngestionRuns);
router.get('/runs/:runId', getIngestionRun);
router.post('/trigger', authorize('member'), triggerIngestion);
router.post('/runs/:runId/cancel', authorize('admin'), cancelIngestionRun);
router.get('/status/:repoId', getIngestionStatus);

export default router;
