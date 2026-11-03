import { Response } from 'express';
import mongoose from 'mongoose';
import Chapter from '../model/Chapter.js';
import Course from '../model/Course.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { canReadCourse } from '../middleware/resourceAccess.js';
import Section from '../model/Section.js';
import Activity from '../model/Activity.js';
import ActivityResult from '../model/ActivityResult.js';


export async function getChaptersByCourse(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { courseId } = req.params;
    if (!mongoose.isValidObjectId(courseId)) return res.status(400).json({ message: 'Invalid course ID.' });
    if (!await canReadCourse(req.user, String(courseId)))
      return res.status(403).json({ message: 'You cannot access this course.' });

    return res.status(200).json(await Chapter.find({ course: courseId }).sort({ order: 1 }));
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function createChapter(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { title, description, course, order } = req.body;
    if (!title?.trim() || !description?.trim() || !mongoose.isValidObjectId(course) || order === undefined) {
      return res.status(400).json({ message: 'Title, description, course, and order are required.' });
    }

    const courseExists = await Course.findOne({ _id: course, teacher: req.user?.id });
    if (!courseExists) return res.status(403).json({ message: 'You can only add chapters to your own courses.' });

    return res.status(201).json(await Chapter.create({
      title: title.trim(),
      description: description.trim(),
      course,
      order
    }));
  } catch (error) {
    return res.status(400).json({ message: 'Invalid chapter data.' });
  }
}

export async function updateChapter(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    if (!await Course.exists({ _id: chapter.course, teacher: req.user?.id })) {
      return res.status(403).json({ message: 'You can only update your own chapters.' });
    }

    const update: Record<string, unknown> = {}; // تم التعديل هنا
    if (req.body.title !== undefined) update.title = String(req.body.title).trim();
    if (req.body.description !== undefined) update.description = String(req.body.description).trim();
    if (req.body.order !== undefined) update.order = req.body.order;

    return res.status(200).json(await Chapter.findByIdAndUpdate(req.params.id, { $set: update }, {
      new: true,
      runValidators: true
    }));
  } catch (error) {
    return res.status(400).json({ message: 'Invalid chapter data.' });
  }
}

export async function deleteChapter(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const chapterId = req.params.id;

    // 1. التحقق من وجود الشابتر وملكيتة للمعلم الحالي
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found.' });
    }

    const isOwner = await Course.exists({ _id: chapter.course, teacher: req.user?.id });
    if (!isOwner) {
      return res.status(403).json({ message: 'You can only delete your own chapters.' });
    }

    // 2. جلب معرفات الأقسام (Sections) التابعة لهذا الشابتر
    const sections = await Section.find({ chapter: chapterId }).select('_id');
    const sectionIds = sections.map(s => s._id);

    // 3. حذف الأنشطة ونتائج الطلاب المرتبطة بهذه الأقسام (فقط إذا وجدت أقسام لتوفير موارد قاعدة البيانات)
    if (sectionIds.length > 0) {
      await Activity.deleteMany({ section: { $in: sectionIds } });
      await ActivityResult.deleteMany({ section: { $in: sectionIds } });
      await Section.deleteMany({ chapter: chapterId });
    }

    // 4. حذف الشابتر نفسه
    await Chapter.findByIdAndDelete(chapterId);

    return res.status(200).json({ message: 'Chapter, sections, and associated activities deleted successfully.' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return res.status(500).json({ message: 'Internal server error while deleting chapter.' });
  }
}