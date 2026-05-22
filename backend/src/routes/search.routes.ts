import { Router } from 'express';
import { query } from 'express-validator';
import * as searchController from '../controllers/search.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const searchValidation = [
  query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt(),
];

// Routes
router.get(
  '/users',
  optionalAuth,
  searchValidation,
  validate,
  searchController.searchUsers
);

export default router;
