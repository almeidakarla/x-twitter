import { Router } from 'express';
import { param } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const usernameValidation = [
  param('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Invalid username'),
];

// Routes
router.get(
  '/:username',
  optionalAuth,
  usernameValidation,
  validate,
  userController.getUserProfile
);

router.get(
  '/:username/followers',
  optionalAuth,
  usernameValidation,
  validate,
  userController.getFollowers
);

router.get(
  '/:username/following',
  optionalAuth,
  usernameValidation,
  validate,
  userController.getFollowing
);

export default router;
