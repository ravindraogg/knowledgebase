import { Router } from 'express';
import { register, login, me, githubOAuth, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/github', authenticate, githubOAuth);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
