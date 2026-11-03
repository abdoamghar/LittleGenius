import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
    name: string;
    email: string;
    password_hash: string;
    role: 'teacher';
    phone?: string;
    subject?: string;
    school?: string;
    avatar: string;
    bio?: string;
    managedClasses: mongoose.Types.ObjectId[];
    createdCourses: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const teacherSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        trim: true,
    },
    email: {
        type: String,
        required: true,
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
        enum: ['teacher'],
        default: 'teacher'
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        default: '',
    },
    subject: { type: String, trim: true, default: '' },
    school: { type: String, trim: true, default: '' },
    avatar: {
        type: String,
        default: 'default-avatar.png',
    },
    bio: {
        type: String,
        maxlength: 500,
    },
    managedClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    createdCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }]
}, { timestamps: true });

export default mongoose.model<ITeacher>('Teacher', teacherSchema);