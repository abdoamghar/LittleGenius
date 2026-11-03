import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'teacher' | 'student';
  };
}

export function protect(req: AuthRequest, res: Response, next: NextFunction): void | Response {
  try {
const secret = process.env.JWT_SECRET;//process: An object in Node.js that provides information about the program's runtime environment
  //secret = 'replace-with-a-long-random-secret';
const token = req.cookies?.littlegenius_token;
  if (!secret) return res.status(500).json({ message: 'JWT_SECRET is not configured.' });
  if (!token) return res.status(401).json({ message: 'Not authorized, no token provided.' });

const decoded = jwt.verify(token, secret) as { id?: string; role?: string };
    if (!decoded.id || !['teacher', 'student'].includes(decoded.role || '')) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }
    req.user = { id: decoded.id, role: decoded.role as 'teacher' | 'student' };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ message: 'Not authorized, token failed or expired.' });
  }
}

export function teacherOnly(req: AuthRequest, res: Response, next: NextFunction): void | Response {
  try {
  if (req.user?.role === 'teacher')
    return next();
  return res.status(403).json({ message: 'Access denied. Only teachers can perform this action.' });
  }catch (error) {
    console.error('Role check failed:', error);
    return res.status(401).json({ message: 'Not authorized, token failed or expired .' });
}
}

export function studentOnly(req: AuthRequest, res: Response, next: NextFunction): void | Response {
  try{
    if (req.user?.role === 'student')
    return next();
    return res.status(403).json({ message: 'Access denied. Only students can perform this action.' });
  }catch (error) {
    console.error('Role check failed:', error);
    return res.status(401).json({ message: 'Not authorized, token failed or expired .' });
}
}
