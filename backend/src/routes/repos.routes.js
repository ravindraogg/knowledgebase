import express from 'express';
import { listRepos, getRepo, createRepo, deleteRepo, listRepoEntities, listRepoCommits } from '../controllers/repos.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listRepos);
router.get('/:id', getRepo);
router.get('/:id/entities', listRepoEntities);
router.get('/:id/commits', listRepoCommits);
router.post('/', authorize('admin'), createRepo);
router.delete('/:id', authorize('admin'), deleteRepo);

export default router;
