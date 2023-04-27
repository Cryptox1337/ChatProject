const mongoose = require('mongoose');
const { Schema } = mongoose;

const serverMemberSchema = new Schema({
  server: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  joined_at: { type: Date, default: Date.now, required: true },
  roles: [{ type: String }],
});

module.exports = mongoose.model('ServerMember', serverMemberSchema);