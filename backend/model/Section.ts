import mongoose, { Schema, Document } from 'mongoose';
//It is the actual lesson that contains explanation and examples. It is the smallest educational unit

export interface ISection extends Document {
  title: string;
  content: string;
  chapter: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true,
    maxlength: 100,
  },
  content: {
    type: String,
    required: [true, 'Section content is required'],
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
  },
  order: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

export default mongoose.model<ISection>('Section', sectionSchema);