import { Router } from 'express';
import {
  getSectionsByChapter,
  createSection,
  updateSection,
  deleteSection
} from '../controllers/sectionController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/chapter/:chapterId', protect, getSectionsByChapter);
router.post('/', protect, teacherOnly, createSection);
router.put('/:id', protect, teacherOnly, updateSection);
router.delete('/:id', protect, teacherOnly, deleteSection);

export default router;
