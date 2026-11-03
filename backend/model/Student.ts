import mongoose, { Schema, Document } from 'mongoose';
//It is the actual lesson that the student reads. It contains the explanation and examples.

export interface IStudent extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: 'student';
  avatar: string;
  dateOfBirth: Date;
  enrolledClasses: mongoose.Types.ObjectId[];
  enrolledCourses: mongoose.Types.ObjectId[];
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}
const studentSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    unique: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  role: {
    type: String,
    enum: ['student'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: 'default-student-avatar.png',
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],

  },
  enrolledClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  }],
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  totalPoints: {

    type: Number,
    default: 0,
    min: 0,
  }
}, { timestamps: true });

export default mongoose.model<IStudent>('Student', studentSchema);
