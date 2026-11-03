import mongoose, { Schema, Document } from 'mongoose';
//It is the classroom that includes a group of students and their teacher
// It is the place where courses are assigned.

export interface IClass extends Document {
  name: string;
  description?: string;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  assignedCourses: mongoose.Types.ObjectId[];// It is the list that prevents the student from seeing courses
  classCode: string; //Unique code that students can use to join clas
  isActive: boolean;
  gradeLevel : string;
  nickname?: string;
  room?: string;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxLength: 50,
    minLength: 3,
  },
  description: {
    type: String,
    required: [true, 'Class description is required'],
    maxlength: 500,
    trim: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  assignedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  classCode: {
    type: String,
    required: [true, 'Class code is required'],
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  nickname: { type: String, default: '' },
  room: { type: String, default: '' },
  gradeLevel: {
    type: String,
    enum: ['6-7', '8-9', '10-12'],
    required: true,
  },
}, { timestamps: true });

export default mongoose.model<IClass>('Class', classSchema);
