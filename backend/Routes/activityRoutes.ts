import { Router } from 'express';
import {
  getActivitiesBySection,
  getActivityById,
  createActivity,
  updateActivity,
  checkActivity,
  submitActivity,
  deleteActivity
} from '../controllers/ActivityController.js';
import { protect, teacherOnly, studentOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/section/:sectionId', protect, getActivitiesBySection);
router.get('/:id', protect, getActivityById);

router.post('/', protect, teacherOnly, createActivity);
router.put('/:id', protect, teacherOnly, updateActivity);
router.delete('/:id', protect, teacherOnly, deleteActivity);

router.post('/:id/check', protect, studentOnly, checkActivity);
router.post('/:id/submit', protect, studentOnly, submitActivity);

export default router;