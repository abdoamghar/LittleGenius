import mongoose from 'mongoose';
import Class from '../model/Class.js';
import Course from '../model/Course.js';
import Chapter from '../model/Chapter.js';
import Section from '../model/Section.js';

type AuthUser = { id: string; role: string };

export async function canReadCourse(user: AuthUser | undefined, courseId: string): Promise<boolean> {
  try{
    if (!user || !mongoose.isValidObjectId(courseId))
     return false;

  if (user.role === 'teacher') {
    return Boolean(await Course.exists({ _id: courseId, teacher: user.id }));
  }
  if (user.role !== 'student') return false;

  const course = await Course.findOne({ _id: courseId, status: 'published' }).select('_id');
  if (!course) return false;

  return Boolean(await Class.exists({
    students: user.id,
    assignedCourses: courseId,
    isActive: true
  }));
  }catch (error) {
    console.error(' canReadCourse', error);
    return false;
}
}

export async function canReadChapter(user: AuthUser | undefined, chapterId: string): Promise<boolean> {
  try {
    if (!user || !mongoose.isValidObjectId(chapterId))
       return false;

  const chapter = await Chapter.findById(chapterId).select('course');
  if (!chapter) return false;
  return canReadCourse(user, chapter.course.toString());

  }catch (error) {
    console.error(' canReadChapter', error);
    return false;
}
}

export async function canReadSection(user: AuthUser | undefined, sectionId: string): Promise<boolean> {
  try {
    if (!user || !mongoose.isValidObjectId(sectionId)) return false;

  const section = await Section.findById(sectionId).select('chapter');
  if (!section) return false;

  return canReadChapter(user, section.chapter.toString());
  }catch (error) {
    console.error(' can readSection', error);
    return false;
}
}