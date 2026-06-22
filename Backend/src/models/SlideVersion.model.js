import mongoose, { Schema } from 'mongoose';
const slideVersionSchema = new Schema({
    slideId: { type: Schema.Types.ObjectId, ref: 'Slide', required: true, index: true },
    title: { type: String, required: true },
    content: { type: [String], default: [] },
    speakerNotes: { type: String, default: '' },
    layout: { type: String },
    versionNumber: { type: Number, required: true },
    reason: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });
export const SlideVersion = mongoose.model('SlideVersion', slideVersionSchema);
