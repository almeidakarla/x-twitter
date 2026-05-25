import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, uploadImage.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), authController.updateProfile);

export default router;
