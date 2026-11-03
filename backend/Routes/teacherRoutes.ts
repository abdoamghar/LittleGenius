import { Router } from 'express';
import {
  register,
  login,
  logout,
  getTeacherProfile,
  updateTeacherProfile
} from '../controllers/teacherAuthController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', protect, teacherOnly, getTeacherProfile);
router.put('/profile', protect, teacherOnly, updateTeacherProfile);

export default router;
