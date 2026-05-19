import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
    found_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoundItem',
        required: true
    },
    claimant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student_id: {
        type: String,
        required: true
    },
    proof_text: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Claimant can only submit one claim per found item to prevent spamming
claimSchema.index({ found_item_id: 1, claimant_id: 1 }, { unique: true });

export default mongoose.model('Claim', claimSchema);
