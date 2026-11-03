import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getAllCourses);
router.get('/:id', protect, getCourseById);
router.post('/', protect, teacherOnly, createCourse);
router.put('/:id', protect, teacherOnly, updateCourse);
router.delete('/:id', protect, teacherOnly, deleteCourse);

export default router;
