import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType = 'mcq' | 'matching' | 'fill_in_the_blanks';
export type ActivityStatus = 'draft' | 'pending_review' | 'published';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface IActivity extends Document {
  title: string;
  type: ActivityType;
  section: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  difficulty: DifficultyLevel;
  status: ActivityStatus;
  isAiGenerated: boolean;
  content: any; // يخزن الأسئلة والإجابات بناءً على نوع النشاط
  explanation?: string;
  instructions?: string;
  art?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  type: {
    type: String,
    enum: ['mcq', 'matching', 'fill_in_the_blanks'],
    required: true,
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published'],
    default: 'draft',
  },
  isAiGenerated: {
    type: Boolean,
    default: false,
  },
  content: {
    type: Schema.Types.Mixed,
    required: true,
  },
  explanation: { type: String, maxlength: 1000 },
  instructions: { type: String, default: '' },
  art: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

activitySchema.index({ section: 1, status: 1 });

export default mongoose.model<IActivity>('Activity', activitySchema);