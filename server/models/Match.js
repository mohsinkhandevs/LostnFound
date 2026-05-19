import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    lost_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LostItem',
        required: true
    },
    found_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoundItem',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Enforce unique pairs of matches to avoid duplicate recommendations
matchSchema.index({ lost_item_id: 1, found_item_id: 1 }, { unique: true });

export default mongoose.model('Match', matchSchema);
