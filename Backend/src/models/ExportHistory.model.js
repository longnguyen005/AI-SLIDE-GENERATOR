import mongoose, { Schema } from 'mongoose';
const exportHistorySchema = new Schema({
    deckId: { type: Schema.Types.ObjectId, ref: 'Deck', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    format: { type: String, enum: ['pptx'], default: 'pptx' },
    fileName: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });
export const ExportHistory = mongoose.model('ExportHistory', exportHistorySchema);
