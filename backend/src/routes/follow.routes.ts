import { Router } from 'express';
import { param } from 'express-validator';
import * as followController from '../controllers/follow.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const usernameValidation = [
  param('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Invalid username'),
];

// Routes
router.post(
  '/:username',
  authenticate,
  usernameValidation,
  validate,
  followController.followUser
);

router.delete(
  '/:username',
  authenticate,
  usernameValidation,
  validate,
  followController.unfollowUser
);

export default router;
