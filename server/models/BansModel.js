const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  bannedAt: {
    type: Date,
    default: Date.now
  },
  unbannedAt: {
    type: Date
  },
  permanent: {
    type: Boolean,
    default: false
  }
});

const Ban = mongoose.model('Ban', banSchema);

module.exports = Ban;
