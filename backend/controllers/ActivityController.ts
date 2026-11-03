import { Response } from 'express';
import mongoose from 'mongoose';
import Activity, { ActivityType } from '../model/Activity.js';
import ActivityResult from '../model/ActivityResult.js';
import Section from '../model/Section.js';
import Chapter from '../model/Chapter.js';
import Course from '../model/Course.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { canReadSection } from '../middleware/resourceAccess.js';

const activityTypes: ActivityType[] = ['mcq', 'matching', 'fill_in_the_blanks'];
const clean = (value: unknown) => String(value ?? '').trim().toLowerCase();

function validContent(type: ActivityType, content: any): boolean {
  if (!content || typeof content !== 'object') return false;
  if (type === 'mcq') {
    const questions = Array.isArray(content.questions) ? content.questions : [content];
    return questions.length > 0 && questions.every((q: any) => q && String(q.question || q.prompt || '').trim() && Array.isArray(q.options) && q.options.length >= 2 && (Number.isInteger(q.correctIndex) ? q.correctIndex >= 0 && q.correctIndex < q.options.length : q.options.some((o: unknown) => clean(o) === clean(q.correctAnswer))));
  }
  if (type === 'matching') return Array.isArray(content.pairs) && content.pairs.length > 0 && content.pairs.every((p: any) => p && clean(p.left) && clean(p.right));
  if (Array.isArray(content.parts)) return content.parts.length > 0 && content.parts.every((p: any) => p && clean(p.correctAnswer ?? p.answer));
  return Boolean(String(content.question || '').trim() && clean(content.correctAnswer));
}

async function teacherOwnsSection(userId: string | undefined, sectionId: string): Promise<boolean> {
  if (!userId || !mongoose.isValidObjectId(sectionId)) return false;
  const section = await Section.findById(sectionId).select('chapter');
  if (!section) return false;
  const chapter = await Chapter.findById(section.chapter).select('course');
  return Boolean(chapter && await Course.exists({ _id: chapter.course, teacher: userId }));
}

function publicActivity(activity: any, student: boolean) {
  const value = activity.toObject ? activity.toObject() : { ...activity };
  delete value.__v;
  if (!student) return value;
  const content = value.content || {};
  if (value.type === 'mcq') {
    const questions = Array.isArray(content.questions) ? content.questions : [content];
    value.content = { ...content, questions: questions.map((q: any) => {
      const { correctAnswer, correctIndex, answer, ...safe } = q;
      return safe;
    }) };
    if (!Array.isArray(content.questions) && value.content.questions.length === 1) {
      const { questions, ...rest } = value.content;
      value.content = { ...rest, ...questions[0] };
    }
  } else if (value.type === 'matching') {
    const rights = (content.pairs || []).map((pair: any) => pair.right).sort(() => Math.random() - 0.5);
    value.content = { ...content, pairs: (content.pairs || []).map(({ id, left }: any) => ({ id, left })), rightOptions: rights };
  } else if (Array.isArray(content.parts)) {
    value.content = { ...content, parts: content.parts.map(({ id, blankId, text, prompt }: any) => ({ id, blankId, text, prompt })) };
  } else {
    const { correctAnswer, answer, ...safe } = content;
    value.content = safe;
  }
  delete value.explanation;
  return value;
}

function grade(activity: any, answers: any, partial = false) {
  const content = activity.content || {};
  const rows: any[] = [];
  if (activity.type === 'mcq') {
    const questions = Array.isArray(content.questions) ? content.questions : [content];
    questions.forEach((q: any, index: number) => {
      const id = String(q.id ?? index);
      const given = answers?.[id] ?? answers?.[q.id];
      const answerIndex = Number.isInteger(q.correctIndex) ? q.correctIndex : (q.options || []).findIndex((o: unknown) => clean(o) === clean(q.correctAnswer));
      if (partial && given === undefined) return;
      const chosen = typeof given === 'number' ? q.options?.[given] : given;
      const correct = typeof given === 'number' ? given === answerIndex : clean(chosen) === clean(q.options?.[answerIndex]);
      rows.push({ id, prompt: q.prompt || q.question, given: chosen ?? null, answer: q.options?.[answerIndex], correct, explanation: q.explanation || activity.explanation || '' });
    });
  } else if (activity.type === 'matching') {
    (content.pairs || []).forEach((pair: any, index: number) => {
      const id = String(pair.id ?? index);
      const given = answers?.[id] ?? answers?.[pair.id];
      if (partial && given === undefined) return;
      const correct = clean(given) === clean(pair.right) || given === pair.id;
      rows.push({ id, prompt: pair.left, given: given ?? null, answer: pair.right, correct, explanation: pair.explanation || `${pair.left} — ${pair.right}.` });
    });
  } else {
    const parts = Array.isArray(content.parts) ? content.parts : [{ id: 'answer', question: content.question, correctAnswer: content.correctAnswer }];
    parts.forEach((part: any, index: number) => {
      const id = String(part.id ?? part.blankId ?? index);
      const expected = part.correctAnswer ?? part.answer;
      const given = answers?.[id] ?? answers?.[part.blankId];
      if (partial && given === undefined) return;
      const correct = clean(given) === clean(expected);
      rows.push({ id, prompt: part.prompt || part.question || part.text || '', given: given ?? null, answer: expected, correct, explanation: part.explanation || activity.explanation || '' });
    });
  }
  const correctAnswers = rows.filter((row) => row.correct).length;
  return { results: rows, correctAnswers, totalQuestions: rows.length, score: rows.length ? Math.round(correctAnswers / rows.length * 100) : 0 };
}

async function loadStudentActivity(req: AuthRequest, res: Response) {
  const activity = await Activity.findById(req.params.id);
  if (!activity) { res.status(404).json({ message: 'Activity not found.' }); return null; }
  if (activity.status !== 'published') { res.status(403).json({ message: 'This activity is not published yet.' }); return null; }
  const sectionId = activity.section.toString();
  if (!await canReadSection(req.user, sectionId)) { res.status(403).json({ message: 'You cannot access this activity.' }); return null; }
  return activity;
}

export async function getActivitiesBySection(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const sectionId = String(req.params.sectionId ?? '');
    if (!mongoose.isValidObjectId(sectionId)) return res.status(400).json({ message: 'Invalid section ID.' });
    if (!await Section.exists({ _id: sectionId })) return res.status(404).json({ message: 'Section not found.' });
    if (!await canReadSection(req.user, sectionId)) return res.status(403).json({ message: 'You cannot access this section.' });
    const filter: any = { section: sectionId };
    const isStudent = req.user?.role === 'student';
    if (isStudent) filter.status = 'published';
    const activities = await Activity.find(filter).sort({ order: 1, createdAt: 1 });
    return res.status(200).json(activities.map((activity) => publicActivity(activity, isStudent)));
  } catch (error) {
    console.error('Could not load activities:', error);
    return res.status(500).json({ message: 'Unable to load activities.' });
  }
}

export async function getActivityById(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    const student = req.user?.role === 'student';
    if (student) {
      const allowed = await loadStudentActivity(req, res);
      if (!allowed) return res;
    } else if (!await teacherOwnsSection(req.user?.id, activity.section.toString())) {
      return res.status(403).json({ message: 'You cannot access this activity.' });
    }
    return res.status(200).json(publicActivity(activity, student));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load activity.' });
  }
}

export async function createActivity(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { title, type, section, difficulty, content, explanation } = req.body;
    if (!title?.trim() || !activityTypes.includes(type) || !mongoose.isValidObjectId(section)) return res.status(400).json({ message: 'Title, valid type, and section ID are required.' });
    if (!validContent(type, content)) return res.status(400).json({ message: 'Activity content does not match the selected type.' });
    if (req.user?.role !== 'teacher' || !await teacherOwnsSection(req.user.id, section)) return res.status(403).json({ message: 'You can only add activities to your own sections.' });
    const sectionRecord = await Section.findById(section).select('chapter');
    const chapter = await Chapter.findById(sectionRecord?.chapter).select('course');
    const activity = await Activity.create({ title: title.trim(), type, section, course: chapter?.course, teacher: req.user?.id, difficulty: difficulty || 'medium', status: 'draft', isAiGenerated: false, content, explanation: explanation?.trim() || '' });
    return res.status(201).json(publicActivity(activity, false));
  } catch (error) {
    console.error('Could not create activity:', error);
    return res.status(500).json({ message: 'Unable to create activity.' });
  }
}

export async function updateActivity(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (req.user?.role !== 'teacher' || !await teacherOwnsSection(req.user.id, activity.section.toString())) return res.status(403).json({ message: 'You can only update your own activities.' });
    const update: Record<string, unknown> = {};
    if (req.body.title !== undefined) update.title = String(req.body.title).trim();
    if (req.body.content !== undefined) {
      if (!validContent(activity.type, req.body.content)) return res.status(400).json({ message: 'Activity content does not match the selected type.' });
      update.content = req.body.content;
    }
    if (req.body.explanation !== undefined) update.explanation = String(req.body.explanation).trim();
    if (req.body.difficulty !== undefined) update.difficulty = req.body.difficulty;
    if (req.body.status !== undefined) {
      if (!['draft', 'pending_review', 'published'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid activity status.' });
      update.status = req.body.status;
    }
    const updated = await Activity.findByIdAndUpdate(activity._id, { $set: update }, { new: true, runValidators: true });
    return res.status(200).json(publicActivity(updated, false));
  } catch (error) {
    console.error('Could not update activity:', error);
    return res.status(500).json({ message: 'Unable to update activity.' });
  }
}

async function evaluate(req: AuthRequest, res: Response, save: boolean): Promise<Response> {
  try {
    const activity = await loadStudentActivity(req, res);
    if (!activity) return res;
    const result = grade(activity, req.body?.answers ?? req.body?.studentAnswer ?? {}, !save);
    if (!save) return res.status(200).json(result);
    const previous = await ActivityResult.findOne({ student: req.user?.id, activity: activity._id }).sort({ attemptNumber: -1 });
    const section = await Section.findById(activity.section).select('chapter');
    const chapter = await Chapter.findById(section?.chapter).select('course');
    const attemptNumber = (previous?.attemptNumber || 0) + 1;
    await ActivityResult.create({ student: req.user?.id, activity: activity._id, section: activity.section, course: chapter?.course, score: result.score, totalQuestions: result.totalQuestions, correctAnswers: result.correctAnswers, studentAnswers: req.body?.answers ?? req.body?.studentAnswer ?? {}, perItem: result.results, attemptNumber, completedAt: new Date() });
    return res.status(200).json({ ...result, attemptNumber });
  } catch (error) {
    console.error('Activity evaluation failed:', error);
    return res.status(500).json({ message: 'Unable to evaluate activity.' });
  }
}

export function checkActivity(req: AuthRequest, res: Response): Promise<Response> { return evaluate(req, res, false); }
export function submitActivity(req: AuthRequest, res: Response): Promise<Response> { return evaluate(req, res, true); }

export async function deleteActivity(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (req.user?.role !== 'teacher' || !await teacherOwnsSection(req.user.id, activity.section.toString())) return res.status(403).json({ message: 'You can only delete your own activities.' });
    await Activity.findByIdAndDelete(activity._id);
    await ActivityResult.deleteMany({ activity: activity._id });
    return res.status(200).json({ message: 'Activity and its results deleted successfully.' });
  } catch (error) {
    console.error('Could not delete activity:', error);
    return res.status(500).json({ message: 'Unable to delete activity.' });
  }
}
