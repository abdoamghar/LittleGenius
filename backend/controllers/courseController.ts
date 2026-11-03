import { Response } from 'express';
import mongoose from 'mongoose';
import Course from '../model/Course.js';
import Class from '../model/Class.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { canReadCourse } from '../middleware/resourceAccess.js';
import Student from '../model/Student.js';
import Chapter from '../model/Chapter.js';
import Section from '../model/Section.js';
import Activity from '../model/Activity.js';
import ActivityResult from '../model/ActivityResult.js';


export async function getAllCourses(req: AuthRequest, res: Response): Promise<Response> {
  try {
    if (req.user?.role === 'teacher') {
      return res.status(200).json(await Course.find({ teacher: req.user.id }).sort({ updatedAt: -1 }));
    }

    const classes = await Class.find({ students: req.user?.id, isActive: true }).select('assignedCourses');
    const courseIds = classes.flatMap((item) => item.assignedCourses);
    const courses = await Course.find({
      _id: { $in: courseIds },
      status: 'published'
    }).sort({ updatedAt: -1 });

    return res.status(200).json(courses);
  } catch (error) {
    console.error('Could not get courses:', error);
    return res.status(500).json({ message: 'Unable to get courses.' });
  }
}

export async function getCourseById(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const id = req.params.id as string;

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course ID.' });
    if (!await canReadCourse(req.user, id)) return res.status(403).json({ message: 'You cannot access this course.' });

    const course = await Course.findById(id)
      .populate('teacher', 'name email')
      .populate('assignedClasses', 'name classCode');

    if (!course) return res.status(404).json({ message: 'Course not found.' });
    return res.status(200).json(course);
  } catch (error) {
    console.error('Could not get course:', error);
    return res.status(500).json({ message: 'Unable to get course.' });
  }
}

export async function createCourse(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { title, description, level, subject, art, ageBand, summary, outcomes } = req.body;
    if (!title?.trim() || !description?.trim() || !['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({ message: 'Title, description, and a valid level are required.' });
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      level,
      status: 'draft',
      subject: subject || '', art: art || '', ageBand: ageBand || '', summary: summary || description.trim(), outcomes: Array.isArray(outcomes) ? outcomes : [],
      teacher: req.user?.id,
      assignedClasses: []
    });

    return res.status(201).json(course);
  } catch (error) {
    console.error('Could not create course:', error);
    return res.status(500).json({ message: 'Unable to create course.' });
  }
}

export async function updateCourse(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course ID.' });

    const course = await Course.findOne({ _id: id, teacher: req.user?.id });
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const update: Record<string, unknown> = {};
    if (req.body.title !== undefined) update.title = String(req.body.title).trim();
    if (req.body.description !== undefined) update.description = String(req.body.description).trim();
    if (req.body.level !== undefined) update.level = req.body.level;
    for (const field of ['subject', 'art', 'ageBand', 'summary'] as const) if (req.body[field] !== undefined) update[field] = String(req.body[field]);
    if (req.body.outcomes !== undefined) update.outcomes = Array.isArray(req.body.outcomes) ? req.body.outcomes : [];
    if (req.body.status !== undefined) update.status = req.body.status;

    const updatedCourse = await Course.findByIdAndUpdate(id, { $set: update }, {
      new: true,
      runValidators: true
    });
    return res.status(200).json(updatedCourse);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid course data.' });
  }
}

export async function deleteCourse(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const id = req.params.id as string;

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course ID.' });

    const course = await Course.findOneAndDelete({ _id: id, teacher: req.user?.id });
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const chapters = await Chapter.find({ course: id }).select('_id');
    const chapterIds = chapters.map((chapter) => chapter._id);
    const sections = await Section.find({ chapter: { $in: chapterIds } }).select('_id');
    const sectionIds = sections.map((section) => section._id);

    await ActivityResult.deleteMany({ course: id });
    await Activity.deleteMany({ section: { $in: sectionIds } });
    await Section.deleteMany({ _id: { $in: sectionIds } });
    await Chapter.deleteMany({ _id: { $in: chapterIds } });

    const courseObjectId = new mongoose.Types.ObjectId(id);

    await Class.updateMany(
      { assignedCourses: courseObjectId },
      { $pull: { assignedCourses: courseObjectId } }
    );

    await Student.updateMany(
      { enrolledCourses: courseObjectId },
      { $pull: { enrolledCourses: courseObjectId } }
    );

    return res.status(200).json({ message: 'Course deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete course.' });
  }
}
