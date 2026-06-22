import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String }
}, { timestamps: true });
export const User = mongoose.model('User', userSchema);
