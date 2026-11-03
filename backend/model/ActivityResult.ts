import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityResult  extends Document {
  student: mongoose.Types.ObjectId;
  activity: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  studentAnswers: any;
  perItem?: any[];
  completedAt: Date;
  attemptNumber: number;
}

const activityResultSchema = new Schema<IActivityResult >({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  studentAnswers: { type: Schema.Types.Mixed, required: true },
  perItem: { type: [Schema.Types.Mixed] as any, default: [] },
  completedAt: {
    type: Date,
    default: Date.now
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min : 1
  }
}, { timestamps: true });

activityResultSchema.index({ student: 1, activity: 1 });
activityResultSchema.index({ activity: 1 });
activityResultSchema.index({ student: 1, course: 1 });
activityResultSchema.index({ student: 1, section: 1 });

export default mongoose.model<IActivityResult>('ActivityResult', activityResultSchema);