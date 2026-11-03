import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student from '../model/Student.js';
import Class from '../model/Class.js';
import ActivityResult  from '../model/ActivityResult.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { getCookieOptions } from './teacherAuthController.js';
import { canReadCourse } from '../middleware/resourceAccess.js';

function createLoginCookie(res: Response, user: { _id: { toString(): string }; role: string }): void {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing from the backend environment.');

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    secret,
    { expiresIn: '8h' }
  );

  res.cookie('littlegenius_token', token, {
    ...getCookieOptions(),
    maxAge: 8 * 60 * 60 * 1000
  });
}

function publicStudent(student: any) {
  return {
    id: student._id.toString(),
    name: student.name,
    email: student.email,
    role: student.role,
    avatar: student.avatar,
    dateOfBirth: student.dateOfBirth,
    totalPoints: student.totalPoints
  };
}

export async function registerStudent(req: Request, res: Response): Promise<Response> {
  try {
    const { name, email, password, dateOfBirth, classCode } = req.body;
        if (!name?.trim() || !email?.trim() || !password || password.length < 8 || !dateOfBirth) {
      return res.status(400).json({ message: 'Name, email, date of birth, and an 8-character password are required.' });
    }
    const birthDate  = new Date(dateOfBirth);
    const today    = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff  = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())){
      age--;
    }
    if (age < 6 || age > 12) {
      return res.status(400).json({ message: 'Student must be between 6 and 12 years old.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetClass = classCode ? await Class.findOne({ classCode: String(classCode).trim().toUpperCase(), isActive: true }) : null;
    if (classCode && !targetClass) return res.status(404).json({ message: 'That class code was not found.' });
    if (await Student.exists({ email: cleanEmail })) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const student = await Student.create({
      name: name.trim(),
      email: cleanEmail,
      password_hash: await bcrypt.hash(password, 12),
      dateOfBirth: new Date(dateOfBirth),
      role: 'student',
      ...(targetClass ? { enrolledClasses: [targetClass._id], enrolledCourses: targetClass.assignedCourses } : {})
    });

    if (targetClass) await Class.findByIdAndUpdate(targetClass._id, { $addToSet: { students: student._id } });
    createLoginCookie(res, student);
    return res.status(201).json({ user: publicStudent(student) });
  } catch (error) {
    console.error('Student registration failed:', error);
    return res.status(500).json({ message: 'Unable to create your account.' });
  }
}

export async function loginStudent(req: Request, res: Response): Promise<Response> {
  try {
    const { email, password } = req.body;
    if (!email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    const student = await Student.findOne({ email:cleanEmail }).select('+password_hash');
    if (!student || !(await bcrypt.compare(password, student.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    createLoginCookie(res, student);
    return res.status(200).json({ user: publicStudent(student) });
  } catch (error) {
    console.error('Student login failed:', error);
    return res.status(500).json({ message: 'Unable to log in.' });
  }
}

export function logoutStudent(_req: Request, res: Response): Response {
  res.clearCookie('littlegenius_token', getCookieOptions());
  return res.status(200).json({ message: 'Logged out successfully.' });
}

export async function getStudentProfile(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const student = await Student.findById(req.user?.id).select('-password_hash')
      .populate({ path: 'enrolledClasses', select: 'name nickname room gradeLevel classCode teacher', populate: { path: 'teacher', select: 'name' } })
      .populate('enrolledCourses', 'title status level subject art ageBand summary outcomes');
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load profile.' });
  }
}
export async function updateStudentProfile(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { name, avatar, dateOfBirth } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = String(name).trim();
    if (avatar !== undefined) update.avatar = String(avatar).trim();
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth;
    const student = await Student.findByIdAndUpdate(
      req.user?.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password_hash');

    if (!student) return res.status(404).json({ message: 'Student not found.' });
    return res.status(200).json({ message: 'Profile updated successfully.', user: student });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid profile data.' });
  }
}

export async function joinClass(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const classCode = String(req.body.classCode || '').trim().toUpperCase();//String(...): Converting a value to text
    if (!classCode || !req.user?.id) {//(req.user?.id): Checking for the existence of the user ID.
      return res.status(400).json({ message: 'Class code is required.' });
    }//req.user?.id = Checks for the presence of the ID of the currently logged-in user,
 // without throwing an error if `user` does not exist.

    const targetClass = await Class.findOne({ classCode, isActive: true });
    if (!targetClass) return res.status(404).json({ message: 'Active class not found.' });

    if (targetClass.students.some((id) => id.toString() === req.user!.id)) {//.some() checks whether the user exists in that list or not.
      return res.status(409).json({ message: 'You are already enrolled in this class.' });
    }//(req.user!.id )= The ID of the user currently logged into the site.


 //This code registers the student for the class, then adds the class and its associated courses
    await Class.findByIdAndUpdate(targetClass._id, {$addToSet: { students: req.user!.id } });

    await Student.findByIdAndUpdate(req.user!.id, {$addToSet: {

        enrolledClasses: targetClass._id,
        enrolledCourses: { $each: targetClass.assignedCourses }
      }
    });

    return res.status(200).json({
      message: 'Successfully joined the class.',
      classDetails: { id: targetClass._id, name: targetClass.name, teacher: targetClass.teacher }
    });
  } catch (error) {
    console.error('Could not join class:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getMyactivity(req: AuthRequest, res: Response): Promise<Response> {
  try {
// Bring only the results of the current student's activities, adding the activity name, information, and course name,
//  and then arranging them from newest to oldest..
    const results = await ActivityResult.find({ student: req.user?.id })
      .populate('activity', 'title type difficulty')
      .populate('course', 'title')
      .sort({ completedAt: -1 });

//This code calculates: how many times the student tried, how much his total score was, and what his average score was.
const totalAttempts = results.length;
let totalScore = 0;

for (const record of results) {
  totalScore = totalScore + record.score;
}
let averageScore = 0;

if (totalAttempts > 0) {
  averageScore = totalScore / totalAttempts;
  averageScore = Number(averageScore.toFixed(2));
}
    return res.status(200).json({
      summary: { totalAttempts, averageScore },
      history: results
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function getCompletedActivities(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const courseId = String(req.params.courseId ?? '');
    if (!await canReadCourse(req.user, courseId)) {//canReadCourse() checks: Does this user have the right to read this course?
      return res.status(403).json({ message: 'You cannot access this course.' });
    }

    const results = await ActivityResult.find({
      student: req.user?.id,
      course: courseId
    }).select('activity score attemptNumber completedAt');// Just give me these fields(activity/score/attemptNumber/completedAt)

    return res.status(200).json({
      completedCount: results.length,//completedCount: The number of activities the student completed in the course.
      details: results//details: Details of each result.

    });
  } catch (error) {
    console.error('Error fetching completed activities:', error);
    return res.status(500).json({ message: 'Error fetching completed activities.' });
  }
}
