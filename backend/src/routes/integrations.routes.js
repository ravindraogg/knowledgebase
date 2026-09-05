import { Router } from 'express';
import {
  listIntegrations, connectGitHub, connectJira, connectSlack,
  disconnectIntegration, testIntegration,
} from '../controllers/integrations.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', listIntegrations);
router.post('/github', connectGitHub);
router.post('/jira', connectJira);
router.post('/slack', connectSlack);
router.delete('/:integrationId', disconnectIntegration);
router.get('/:integrationId/test', testIntegration);

export default router;
