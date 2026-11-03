import { Response } from 'express';
import mongoose from 'mongoose';
import Activity, { ActivityType } from '../model/Activity.js';
import Section from '../model/Section.js';
import Chapter from '../model/Chapter.js';
import Course from '../model/Course.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const supportedTypes: ActivityType[] = ['mcq', 'matching', 'fill_in_the_blanks'];
type Difficulty = 'easy' | 'medium' | 'hard';

async function ownedSection(userId: string | undefined, sectionId: string) {
  if (!userId || !mongoose.isValidObjectId(sectionId)) return null;
  const section = await Section.findById(sectionId).select('chapter title content');
  if (!section) return null;
  const chapter = await Chapter.findById(section.chapter).select('course');
  if (!chapter || !await Course.exists({ _id: chapter.course, teacher: userId })) return null;
  return { section, chapter };
}

function toStoredContent(type: ActivityType, generated: any): any {
  if (type === 'mcq') {
    const questions = Array.isArray(generated.questions) ? generated.questions : [{ id: 'q1', question: generated.question, options: generated.options, correctAnswer: generated.correctAnswer, explanation: generated.explanation }];
    return { questions: questions.map((question: any) => {
      const options = Array.isArray(question.options) ? question.options : [];
      const correctAnswer = question.correctAnswer ?? question.answer ?? options[question.correctIndex];
      const correctIndex = Number.isInteger(question.correctIndex)
        ? question.correctIndex
        : options.findIndex((option: unknown) => String(option).trim().toLowerCase() === String(correctAnswer ?? '').trim().toLowerCase());
      return { ...question, options, correctAnswer, correctIndex };
    }) };
  }
  if (type === 'matching') return { pairs: generated.pairs };
  return Array.isArray(generated.parts) ? { question: generated.question, wordBank: generated.wordBank || [], parts: generated.parts } : { question: generated.question, correctAnswer: generated.correctAnswer, explanation: generated.explanation };
}

function isValidContent(type: ActivityType, content: any): boolean {
  if (type === 'mcq') return Array.isArray(content.questions) && content.questions.length > 0 && content.questions.every((q: any) => String(q.question || q.prompt || '').trim() && Array.isArray(q.options) && q.options.length >= 2 && (Number.isInteger(q.correctIndex) ? q.correctIndex >= 0 && q.correctIndex < q.options.length : q.options.some((option: unknown) => String(option).trim().toLowerCase() === String(q.correctAnswer ?? '').trim().toLowerCase())));
  if (type === 'matching') return Array.isArray(content.pairs) && content.pairs.length > 0 && content.pairs.every((pair: any) => String(pair.left || '').trim() && String(pair.right || '').trim());
  if (Array.isArray(content.parts)) return content.parts.length > 0 && content.parts.every((part: any) => String(part.correctAnswer ?? part.answer ?? '').trim());
  return Boolean(String(content.question || '').trim() && String(content.correctAnswer ?? '').trim());
}

async function generate(req: AuthRequest, res: Response, existing?: any): Promise<Response> {
  try {
    const { sectionId, lessonContent, type, difficulty = existing?.difficulty || 'easy', title = existing?.title } = req.body;
    const targetSectionId = sectionId || existing?.section?.toString();
    const owned = await ownedSection(req.user?.id, targetSectionId);
    if (req.user?.role !== 'teacher' || !owned) return res.status(403).json({ message: 'You can only generate activities for your own lessons.' });
    const activityType: ActivityType = type || existing?.type;
    const sourceText = String(lessonContent || owned.section.content || '').trim();
    if (!sourceText || !supportedTypes.includes(activityType)) return res.status(400).json({ message: 'sectionId, lessonContent, and a supported activity type are required.' });
    if (!['easy', 'medium', 'hard'].includes(difficulty)) return res.status(400).json({ message: 'difficulty must be easy, medium, or hard.' });
    const response = await fetch((process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/generate-activity', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lessonContent: sourceText, type: activityType, difficulty, title: title || owned.section.title })
    });
    const data = await response.json().catch(() => ({})) as { activity?: any; source?: string; message?: string };
    if (!response.ok) {
      return res.status(response.status === 503 ? 503 : 502).json({
        message: data.message || 'The AI service could not generate an activity. No draft was created.'
      });
    }
    if (data.source !== 'ai-provider') {
      return res.status(502).json({ message: 'The AI model did not generate this activity. No draft was created.' });
    }
    const content = toStoredContent(activityType, data.activity || {});
    if (!isValidContent(activityType, content)) throw new Error('AI returned an incomplete or invalid activity.');
    if (existing) {
      existing.title = String(data.activity?.title || title || existing.title).trim();
      existing.content = content;
      existing.difficulty = difficulty as Difficulty;
      existing.explanation = String(data.activity?.explanation || '');
      existing.isAiGenerated = true;
      existing.status = 'pending_review';
      await existing.save();
      return res.status(200).json({ message: 'Activity regenerated and returned to teacher review.', activity: existing });
    }
    const activity = await Activity.create({ title: String(data.activity?.title || title || 'Generated activity').trim(), type: activityType, section: owned.section._id, course: owned.chapter.course, teacher: req.user?.id, difficulty, status: 'pending_review', isAiGenerated: true, content, explanation: String(data.activity?.explanation || '') });
    return res.status(201).json({ message: 'Activity generated and saved for teacher review.', activity });
  } catch (error) {
    console.error('AI generation failed:', error);
    return res.status(502).json({ message: 'AI service is unavailable or returned invalid content.' });
  }
}

export function generateActivity(req: AuthRequest, res: Response): Promise<Response> { return generate(req, res); }
export async function regenerateActivity(req: AuthRequest, res: Response): Promise<Response> {
  const activity = await Activity.findById(req.params.id);
  if (!activity) return res.status(404).json({ message: 'Activity not found.' });
  return generate(req, res, activity);
}
