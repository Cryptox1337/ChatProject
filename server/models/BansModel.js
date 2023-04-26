const mongoose = require('mongoose');

const bansSchema = new mongoose.Schema({
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

const Bans = mongoose.model('Bans', bansSchema);

module.exports = Bans;
