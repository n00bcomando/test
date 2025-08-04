const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  offerId: {
    type: String,
    required: true,
    unique: true
  },
  provider: {
    type: String,
    enum: ['adgate', 'offertoro', 'cpxresearch', 'ayetstudios'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reward: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['survey', 'app_download', 'game', 'signup', 'purchase', 'video', 'other'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  estimatedTime: {
    type: Number, // in minutes
    required: true
  },
  requirements: {
    type: String
  },
  countries: [{
    type: String
  }],
  devices: [{
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String
  },
  clickUrl: {
    type: String,
    required: true
  },
  completions: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
offerSchema.index({ provider: 1, isActive: 1 });
offerSchema.index({ category: 1, reward: -1 });
offerSchema.index({ countries: 1 });

module.exports = mongoose.model('Offer', offerSchema);