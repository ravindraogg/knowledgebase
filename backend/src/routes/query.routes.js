import express from 'express';
import { submitQuery, ragSubmit, getQueryHistory, getQuery, updateQuery, deleteQuery, executeRawCypher } from '../controllers/query.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('member'), submitQuery);
router.post('/rag', authorize('member'), ragSubmit);
router.get('/history', authorize('member'), getQueryHistory);
router.get('/:queryId', getQuery);
router.patch('/:queryId', authorize('member'), updateQuery);
router.delete('/:queryId', authorize('member'), deleteQuery);
router.post('/cypher', authorize('admin'), executeRawCypher);

export default router;
