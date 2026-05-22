import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as tweetController from '../controllers/tweet.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();

// Validation rules
const createTweetValidation = [
  body('content')
    .isLength({ min: 1, max: 280 })
    .withMessage('Tweet must be between 1 and 280 characters'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Invalid parent tweet ID'),
];

const paginationValidation = [
  query('cursor')
    .optional()
    .isString(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
];

const tweetIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid tweet ID'),
];

// Routes
router.post(
  '/',
  authenticate,
  uploadImage.single('image'),
  createTweetValidation,
  validate,
  tweetController.createTweet
);

router.get(
  '/timeline',
  authenticate,
  paginationValidation,
  validate,
  tweetController.getTimeline
);

router.get(
  '/user/:username',
  optionalAuth,
  paginationValidation,
  validate,
  tweetController.getUserTweets
);

router.get(
  '/:id',
  optionalAuth,
  tweetIdValidation,
  validate,
  tweetController.getTweet
);

router.get(
  '/:id/replies',
  optionalAuth,
  tweetIdValidation,
  paginationValidation,
  validate,
  tweetController.getTweetReplies
);

router.delete(
  '/:id',
  authenticate,
  tweetIdValidation,
  validate,
  tweetController.deleteTweet
);

router.post(
  '/:id/like',
  authenticate,
  tweetIdValidation,
  validate,
  tweetController.likeTweet
);

router.delete(
  '/:id/like',
  authenticate,
  tweetIdValidation,
  validate,
  tweetController.unlikeTweet
);

export default router;
