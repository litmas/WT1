import express from 'express';
import { home, logout } from '../controllers/homeController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

/**
 * Includes routes for the home page with auth and logout.
 */
const router = express.Router();

router.get('/auth', isAuthenticated, home);
router.get('/logout', logout);

export default router;
