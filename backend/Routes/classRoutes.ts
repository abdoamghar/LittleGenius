import { Router } from 'express';
import {
  createClass,
  getMyClasses,
  assignCourseToClass,
  getClassProgress,
  removeStudentFromClass,
  getClassPerformance
} from '../controllers/classController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';
import { addStudentToClass, deleteClass } from '../controllers/classController.js';

const router = Router();
router.use(protect, teacherOnly);

router.post('/', createClass);
router.get('/', getMyClasses);
router.post('/:classId/assign-course', assignCourseToClass);
router.get('/:classId/progress', getClassProgress);
router.delete('/:classId/students/:studentId', removeStudentFromClass);
router.delete('/:classId', deleteClass);
router.get('/:classId/performance', getClassPerformance);
router.post('/:classId/students', addStudentToClass);


export default router;
