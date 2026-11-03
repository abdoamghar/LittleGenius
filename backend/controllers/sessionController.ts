import { Response } from 'express';
import Teacher from '../model/Teacher.js';
import Student from '../model/Student.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const user: any = req.user?.role === 'teacher'
      ? await Teacher.findById(req.user?.id).select('-password_hash')
      : await Student.findById(req.user?.id).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    const value: any = user.toObject();
    return res.status(200).json({ user: { ...value, id: value._id.toString() } });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load the current account.' });
  }
}
