import { Router } from 'express';
import { generateActivity, regenerateActivity } from '../controllers/aiController.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, teacherOnly);
router.post('/activities', generateActivity);
router.post('/activities/:id/regenerate', regenerateActivity);

export default router;
