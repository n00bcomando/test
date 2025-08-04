const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'offer_completion', 'referral_bonus', 'admin_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['roblox', 'paypal', 'crypto', 'gift_card']
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    offerId: String,
    offerProvider: String,
    robloxGamepassId: String,
    paymentId: String,
    adminNote: String,
    referralUserId: mongoose.Schema.Types.ObjectId
  },
  processedAt: {
    type: Date
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);