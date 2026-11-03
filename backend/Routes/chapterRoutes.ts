import { Router } from 'express';
import {
  getChaptersByCourse,
  createChapter,
  updateChapter,
  deleteChapter
} from '../controllers/chapterController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/course/:courseId', protect, getChaptersByCourse);
router.post('/', protect, teacherOnly, createChapter);
router.put('/:id', protect, teacherOnly, updateChapter);
router.delete('/:id', protect, teacherOnly, deleteChapter);

export default router;
