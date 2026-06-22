import mongoose, { Schema } from 'mongoose';
const outlineSectionSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String },
    order: { type: Number, required: true }
}, { _id: false });
const deckSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    language: { type: String, enum: ['English', 'en'], default: 'English' },
    tone: { type: String, enum: ['professional', 'academic', 'simple', 'persuasive'], required: true },
    slideCount: { type: Number, min: 1, max: 10, required: true },
    status: {
        type: String,
        enum: ['draft', 'outline_ready', 'generating', 'ready', 'failed'],
        default: 'draft'
    },
    outline: {
        sections: { type: [outlineSectionSchema], default: [] }
    }
}, { timestamps: true });
export const Deck = mongoose.model('Deck', deckSchema);
