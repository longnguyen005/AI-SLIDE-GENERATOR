import mongoose, { Schema } from 'mongoose';
const slideSchema = new Schema({
    deckId: { type: Schema.Types.ObjectId, ref: 'Deck', required: true, index: true },
    slideNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: [String], default: [] },
    speakerNotes: { type: String, default: '' },
    layout: {
        type: String,
        enum: ['title', 'content', 'two_column', 'section', 'summary'],
        default: 'content'
    }
}, { timestamps: true });
slideSchema.index({ deckId: 1, slideNumber: 1 }, { unique: true });
export const Slide = mongoose.model('Slide', slideSchema);
