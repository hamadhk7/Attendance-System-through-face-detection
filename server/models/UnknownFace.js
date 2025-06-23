const mongoose = require('mongoose');

const unknownFaceSchema = new mongoose.Schema({
  detectedAt: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    required: true
  },
  image: {
    type: String, // Base64 encoded image
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UnknownFace', unknownFaceSchema);