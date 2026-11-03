import { Response } from 'express';
import mongoose from 'mongoose';
import Section from '../model/Section.js';
import Chapter from '../model/Chapter.js';
import Course from '../model/Course.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { canReadChapter } from '../middleware/resourceAccess.js';
import ActivityResult from '../model/ActivityResult.js';
import Activity from '../model/Activity.js';


export async function getSectionsByChapter(req: AuthRequest, res: Response): Promise<Response> {
  try {
    // 1. إجبار TypeScript على اعتبار المعرف نصاً (String)
    const chapterId = req.params.chapterId as string;

    if (!mongoose.isValidObjectId(chapterId)) {
      return res.status(400).json({ message: 'Invalid chapter ID.' });
    }

    // 2. إذا كانت canReadChapter تتطلب ObjectId، نقوم بإنشائه هنا
    const objectId = new mongoose.Types.ObjectId(chapterId);

    // 3. استخدام (as any) لتجاوز أي تعارض في الأنواع مع دالة الحماية
    if (!await canReadChapter(req.user, objectId as any)) {
      return res.status(403).json({ message: 'You cannot access this chapter.' });
    }

    // Mongoose يقوم بتحويل النص إلى ObjectId تلقائياً في الاستعلامات
    return res.status(200).json(await Section.find({ chapter: chapterId }).sort({ order: 1 }));
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function teacherOwnsChapter(userId: string | undefined, chapterId: string) {
  const chapter = await Chapter.findById(chapterId).select('course');
  return Boolean(chapter && await Course.exists({ _id: chapter.course, teacher: userId }));
}

export async function createSection(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { title, content, chapter, order } = req.body;
    if (!title?.trim() || !content?.trim() || !mongoose.isValidObjectId(chapter) || order === undefined) {
      return res.status(400).json({ message: 'Title, content, chapter, and order are required.' });
    }
    if (!await teacherOwnsChapter(req.user?.id, chapter)) {
      return res.status(403).json({ message: 'You can only add sections to your own courses.' });
    }
    return res.status(201).json(await Section.create({ title: title.trim(), content: content.trim(), chapter, order }));
  } catch (error) {
    return res.status(400).json({ message: 'Invalid section data.' });
  }
}

export async function updateSection(req: AuthRequest, res: Response): Promise<Response> {
  const section = await Section.findById(req.params.id);
  if (!section) return res.status(404).json({ message: 'Section not found.' });
  if (!await teacherOwnsChapter(req.user?.id, section.chapter.toString())) {
    return res.status(403).json({ message: 'You can only update your own sections.' });
  }
  const update: any = {};
  if (req.body.title !== undefined) update.title = String(req.body.title).trim();
  if (req.body.content !== undefined) update.content = String(req.body.content).trim();
  if (req.body.order !== undefined) update.order = req.body.order;
  return res.status(200).json(await Section.findByIdAndUpdate(req.params.id, { $set: update }, {
    new: true,
    runValidators: true
  }));
}

export async function deleteSection(req: AuthRequest, res: Response) {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found.' });
    if (!await teacherOwnsChapter(req.user?.id, section.chapter.toString())) {
      return res.status(403).json({ message: 'You can only delete your own sections.' });
    }

    // 1. حذف السكشن
    await Section.findByIdAndDelete(req.params.id);

    // 2. حذف الأنشطة المرتبطة به
    await Activity.deleteMany({ section: req.params.id });

    // 3. حذف نتائج الطلاب المرتبطة بهذه الأنشطة (لتنظيف قاعدة البيانات)
    await ActivityResult.deleteMany({ section: req.params.id });

    return res.status(200).json({ message: 'Section and its activities deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting section.' });
  }
}