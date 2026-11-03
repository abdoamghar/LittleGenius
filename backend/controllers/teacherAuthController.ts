import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Teacher, { ITeacher } from '../model/Teacher.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  };
}

function getPublicUser(user: ITeacher) {//It is a security filter between the database and the front end
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    subject: user.subject,
    school: user.school,
    avatar: user.avatar,
    bio: user.bio
  };
}

function createLoginCookie(res: Response, user: ITeacher): void {
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new Error('JWT_SECRET is missing from the backend environment.');

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

export async function register(
  req: Request<{}, {}, RegisterBody>,
  res: Response
): Promise<Response> {
  try {
    const { name, email, password, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, email, and an 8-character password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (await Teacher.exists({ email: cleanEmail })) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const user = await Teacher.create({
      name: name.trim(),
      email: cleanEmail,
      password_hash: await bcrypt.hash(password, 12),//12 Number of encryption rounds
      phone: phone?.trim() || '',
      role: 'teacher'
    });

    createLoginCookie(res, user);
    return res.status(201).json({ user: getPublicUser(user) });
  } catch (error) {
    console.error('Teacher registration failed:', error);
    return res.status(500).json({ message: 'Unable to create your account.' });
  }
}

export async function login(
  req: Request<{}, {}, LoginBody>,
  res: Response
): Promise<Response> {
  try {
    const { email, password } = req.body;
    if (!email?.trim().toLowerCase() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    const user = await Teacher.findOne({ email:cleanEmail }).select('+password_hash');
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    createLoginCookie(res, user);
    return res.status(200).json({ user: getPublicUser(user) });
  } catch (error) {
    console.error('Teacher login failed:', error);
    return res.status(500).json({ message: 'Unable to log in.' });
  }
}

export function logout(_req: Request, res: Response): Response {
  res.clearCookie('littlegenius_token', getCookieOptions());
  return res.status(200).json({ message: 'Logged out successfully.' });
}

export async function getTeacherProfile(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const teacher = await Teacher.findById(req.user?.id).select('-password_hash'); // Exclude password
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    return res.status(200).json(teacher);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load profile.' });
  }
}

export async function updateTeacherProfile(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { name, phone, bio, avatar, subject, school } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = String(name).trim();
    if (phone !== undefined) update.phone = String(phone).trim();
    if (subject !== undefined) update.subject = String(subject).trim();
    if (school !== undefined) update.school = String(school).trim();
    if (bio !== undefined) update.bio = String(bio).trim();
    if (avatar !== undefined) update.avatar = String(avatar).trim();
    const teacher = await Teacher.findByIdAndUpdate(
      req.user?.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password_hash');

    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    return res.status(200).json({ message: 'Profile updated successfully.', user: teacher });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid profile data.' });
  }
}
