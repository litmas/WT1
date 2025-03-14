import express from 'express';
import { login, callback } from '../controllers/authController.js';

/**
 * Includes routes for the authorization part
 * of the application where it includes login and callback.
 */
const router = express.Router();

router.get('/login', login);
router.get('/callback', callback);

export default router;
