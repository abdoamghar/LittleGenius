import mongoose, { Document, Schema } from 'mongoose';
//It is the major academic subject or general topic
//No chapter or section can exist without it

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface ICourse extends Document {
  title: string;
  description: string;
  level: CourseLevel;
  status: CourseStatus;//Draft / Published/Archived)
  teacher: mongoose.Types.ObjectId;
  assignedClasses: mongoose.Types.ObjectId[];
  subject?: string; art?: string; ageBand?: string; summary?: string; outcomes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published' ,'archived'],
    default: 'draft'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  subject: { type: String, trim: true, default: '' },
  art: { type: String, default: '' },
  ageBand: { type: String, default: '' },
  summary: { type: String, default: '' },
  outcomes: { type: [String], default: [] }
}, { timestamps: true });

courseSchema.index({ teacher: 1, status: 1 });//To speed up queries that search for courses taught
// by a specific professor with a particular status

export default mongoose.model<ICourse>('Course', courseSchema);
