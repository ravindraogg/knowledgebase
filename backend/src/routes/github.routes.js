import express from 'express';
import {
  listGithubRepos,
  importGithubRepo,
  syncCommits,
  buildKnowledgeBase,
  getCommits,
} from '../controllers/github.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/repos', listGithubRepos);
router.post('/repos/:owner/:name/import', authorize('admin'), importGithubRepo);
router.post('/repos/:repoId/sync', authorize('admin'), syncCommits);
router.post('/repos/:repoId/build-kb', authorize('admin'), buildKnowledgeBase);
router.get('/repos/:repoId/commits', getCommits);

export default router;
