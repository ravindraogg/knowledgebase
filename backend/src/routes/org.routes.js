import { Router } from 'express';
import {
  getOrg, updateOrg, listMembers,
  inviteUser, provisionUser, changeMemberRole, updateMemberScopes, removeMember,
} from '../controllers/org.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getOrg);
router.patch('/', authorize('admin'), updateOrg);
router.get('/members', authorize('admin'), listMembers);
router.post('/members/invite', authorize('admin'), inviteUser);
router.post('/members/provision', authorize('admin'), provisionUser);
router.patch('/members/:userId/role', authorize('admin'), changeMemberRole);
router.patch('/members/:userId/scopes', authorize('admin'), updateMemberScopes);
router.delete('/members/:userId', authorize('admin'), removeMember);

export default router;
