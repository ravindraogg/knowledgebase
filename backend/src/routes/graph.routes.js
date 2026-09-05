import express from 'express';
import { exploreGraph, getGraphStats, searchGraph, getEntity, getEntityHistory } from '../controllers/graph.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/explore', exploreGraph);
router.get('/stats', getGraphStats);
router.get('/search', searchGraph);
router.get('/entity/:entityId', getEntity);
router.get('/entity/:entityId/history', getEntityHistory);

export default router;
