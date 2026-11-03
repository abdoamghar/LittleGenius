import { Response } from 'express';
import Activity from '../model/Activity.js';
import mongoose from 'mongoose';
import Class from '../model/Class.js';
import Student from '../model/Student.js';
import Course from '../model/Course.js';
import ActivityResult from '../model/ActivityResult.js';
import Teacher from '../model/Teacher.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';


export async function createClass(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { name, description , gradeLevel  } = req.body;
    if (!name?.trim() || !description?.trim() || !['6-7', '8-9', '10-12'].includes(gradeLevel) || !req.user?.id) {
      return res.status(400).json({ message: 'Class name, description, and a valid grade level are required.' });
    }

    const newClass = await Class.create({
      name: name.trim(),
      description: description.trim(),
      teacher: req.user.id,//The ID of the instructor who created the section is stored within a property
      classCode:'CLS-' + crypto.randomInt(1000, 9999),//Math.floor(): removes the decimal part of a number,
      students: [],//Create the section with an empty list of students.
      assignedCourses: [],
      gradeLevel: gradeLevel
    });
//We are looking for the professor who created the department, in preparation for adding the department to his list.
    await Teacher.findByIdAndUpdate(req.user.id, {
      $addToSet: { managedClasses: newClass._id }
    });

    return res.status(201).json(newClass);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating class.' });
  }
}

export async function getMyClasses(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const classes = await Class.find({ teacher: req.user?.id })
    .populate('students', 'name email')
    .populate('assignedCourses', 'title status level');
  return res.status(200).json(classes);
  }catch (error) {
    console.error('Error getting classes: ', error);
  return res.status(500).json({ message: 'Error getting classes.' });
 }
}

export async function assignCourseToClass(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { classId } = req.params;
    const { courseId } = req.body;
    if (!mongoose.isValidObjectId(classId) || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'Invalid class or course ID.' });
    }

    const targetClass = await Class.findOne({ _id: classId, teacher: req.user?.id });
    const course = await Course.findOne({ _id: courseId, teacher: req.user?.id, status: 'published' });
    if (!targetClass || !course) {
      return res.status(403).json({ message: 'The class and published course must belong to you.' });
    }

    await Class.findByIdAndUpdate(classId, { $addToSet: { assignedCourses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { assignedClasses: classId } });
    await Student.updateMany({ _id: { $in: targetClass.students } }, {
      $addToSet: { enrolledCourses: courseId }
    });

    const updatedClass = await Class.findById(classId).populate('assignedCourses', 'title status');
    return res.status(200).json({ message: 'Course assigned successfully.', class: updatedClass });
  } catch (error) {
    return res.status(500).json({ message: 'Error assigning course.' });
  }
}
//The function collects student data and results, enabling the professor to monitor their academic progress.
export async function getClassProgress(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const targetClass = await Class.findOne({ _id: req.params.classId, teacher: req.user?.id })
      .populate('students', 'name');
    if (!targetClass) return res.status(404).json({ message: 'Class not found.' });

    const studentIds = targetClass.students.map((student: any) => student._id);
    const progressRecords = await ActivityResult.find({ student: { $in: studentIds } })
      .where('course').in(targetClass.assignedCourses)
      .populate('student', 'name')
      .populate('activity', 'title type difficulty')
      .populate('course', 'title');

    return res.status(200).json({ class: targetClass.name, progress: progressRecords });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching progress.' });
  }
}

export async function removeStudentFromClass(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { classId, studentId } = req.params;
    if (!mongoose.isValidObjectId(classId) || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: 'Invalid class or student ID.' });
    }
    const targetClass = await Class.findOne({ _id: classId, teacher: req.user?.id });
    if (!targetClass) return res.status(404).json({ message: 'Class not found.' });

    const studentObjectId = new mongoose.Types.ObjectId(String(studentId));
    const classCourseIds = targetClass.assignedCourses.map((id: any) => id.toString());
    const otherClasses = await Class.find({
      _id: { $ne: targetClass._id },
      students: studentObjectId,
      isActive: true
    }).select('assignedCourses');
    const retainedCourses = new Set(otherClasses.flatMap((item: any) => item.assignedCourses.map((id: any) => id.toString())));
    const removeCourses = classCourseIds.filter((courseId: string) => !retainedCourses.has(courseId));

    await Class.findByIdAndUpdate(classId, { $pull: { students: studentId } });
    const studentUpdate: any = { $pull: { enrolledClasses: targetClass._id } };
    if (removeCourses.length) studentUpdate.$pull.enrolledCourses = { $in: removeCourses };
    await Student.findByIdAndUpdate(studentId, studentUpdate);
    return res.status(200).json({ message: 'Student removed successfully.' });
  } catch (error) {
    console.error('Error removing student from class:', error);
    return res.status(500).json({ message: 'Error removing student.' });
  }
}
export async function getClassPerformance(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const targetClass = await Class.findOne({ _id: req.params.classId, teacher: req.user?.id });
    if (!targetClass) return res.status(404).json({ message: 'Class not found.' });

    const records = await ActivityResult.find({
      student: { $in: targetClass.students },
      course: { $in: targetClass.assignedCourses }
    });
    const totalScore = records.reduce((sum, record) => sum + record.score, 0);
    const averageScore = records.length ? Number((totalScore / records.length).toFixed(2)) : 0;
    const stats = new Map<string, { total: number; correct: number }>();

    for (const record of records) {
      const key = record.activity.toString();
      const current = stats.get(key) || { total: 0, correct: 0 };
      current.total += 1;
      if (record.score >= 50) current.correct += 1;
      stats.set(key, current);
    }

    const difficultIds = [...stats.entries()]
      .filter(([, value]) => value.correct / value.total < 0.5)
      .map(([id]) => id);

    const difficultActivities = await Activity.find({ _id: { $in: difficultIds } })
      .select('title type difficulty');

    return res.status(200).json({
      totalStudents: targetClass.students.length,
      activeStudents: new Set(records.map((record) => record.student.toString())).size,
      averageScore,
      totalActivitiesCompleted: records.length,
      difficultActivities
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export async function addStudentToClass(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { classId } = req.params;
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || req.body.studentEmail || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const dateOfBirth = req.body.dateOfBirth;
    if (!mongoose.isValidObjectId(classId) || !email) return res.status(400).json({ message: 'A valid class ID and student email are required.' });
    const targetClass = await Class.findOne({ _id: classId, teacher: req.user?.id });
    if (!targetClass) return res.status(404).json({ message: 'Class not found or you do not have permission.' });

    let student = await Student.findOne({ email });
    if (student) return res.status(409).json({ message: 'A student account already uses this email. Ask the learner to register with this class code instead.' });
    if (!student) {
      if (!name || password.length < 8 || !dateOfBirth) return res.status(400).json({ message: 'Name, email, date of birth, and a password of at least 8 characters are required for a new learner.' });
      const birthDate = new Date(dateOfBirth);
      if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return res.status(400).json({ message: 'Enter a valid date of birth.' });
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
      if (age < 6 || age > 12) return res.status(400).json({ message: 'Student must be between 6 and 12 years old.' });
      student = await Student.create({ name, email, password_hash: await bcrypt.hash(password, 12), dateOfBirth: birthDate, role: 'student' });
    }

    await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
    await Student.findByIdAndUpdate(student._id, { $addToSet: { enrolledClasses: targetClass._id, enrolledCourses: { $each: targetClass.assignedCourses } } });
    return res.status(201).json({ message: 'Student account added to the class.', student: { id: student._id.toString(), name: student.name, email: student.email } });
  } catch (error) {
    console.error('Error adding student to class:', error);
    return res.status(500).json({ message: 'Unable to add the student to this class.' });
  }
}

export async function deleteClass(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: 'Invalid class ID.' });

    const targetClass = await Class.findOne({ _id: classId, teacher: req.user?.id });
    if (!targetClass) return res.status(404).json({ message: 'Class not found.' });

    const classCourseIds = targetClass.assignedCourses.map((id: any) => id.toString());
    for (const studentId of targetClass.students) {
      const otherClasses = await Class.find({
        _id: { $ne: targetClass._id },
        students: studentId,
        isActive: true
      }).select('assignedCourses');
      const retainedCourses = new Set(otherClasses.flatMap((item: any) => item.assignedCourses.map((id: any) => id.toString())));
      const removeCourses = classCourseIds.filter((courseId: string) => !retainedCourses.has(courseId));
      const update: any = { $pull: { enrolledClasses: targetClass._id } };
      if (removeCourses.length) update.$pull.enrolledCourses = { $in: removeCourses };
      await Student.findByIdAndUpdate(studentId, update);
    }

    await Course.updateMany(
      { assignedClasses: targetClass._id },
      { $pull: { assignedClasses: targetClass._id } }
    );
    await Teacher.findByIdAndUpdate(req.user?.id, { $pull: { managedClasses: targetClass._id } });
    await Class.findByIdAndDelete(targetClass._id);

    return res.status(200).json({ message: 'Class deleted successfully. Student accounts and learning results were kept.' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({ message: 'Unable to delete class.' });
  }
}