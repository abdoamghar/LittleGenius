import mongoose, { Schema, Document } from 'mongoose';
//It is the largest unit within the subject matter. It divides the course into major sections.
// It always comes within a specific course, and has an arrangement
export interface IChapter extends Document {
  title: string;
  description: string;
  course: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model<IChapter>('Chapter', chapterSchema);
