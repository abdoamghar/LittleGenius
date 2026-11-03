import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  logoutStudent,
  joinClass,
  getStudentProfile,
  updateStudentProfile,
  getCompletedActivities,
  getMyactivity
} from '../controllers/studentController.js';
import { protect, studentOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.post('/logout', logoutStudent);
router.post('/join-class', protect, studentOnly, joinClass);
router.get('/profile', protect, studentOnly, getStudentProfile);
router.put('/profile', protect, studentOnly, updateStudentProfile);
router.get('/progress/:courseId/completed', protect, studentOnly, getCompletedActivities);
router.get('/my-activities', protect, studentOnly, getMyactivity);

export default router;
