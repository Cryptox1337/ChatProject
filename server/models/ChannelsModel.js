const mongoose = require('mongoose');
const { Schema } = mongoose;

const channelSchema = new Schema({
  type: { type: String, enum: ['SERVER_TEXT', 'DM', 'SERVER_VOICE', 'GROUP_DM', 'SERVER_CATEGORY', 'SERVER_ANNOUNCEMENT', 'ANNOUNCEMENT_THREAD', 'PUBLIC_THREAD', 'PRIVATE_THREAD', 'SERVER_STAGE_VOICE', 'SERVER_DIRECTORY', 'SERVER_FORUM'], required: true },
  server_id: { type: String },
  recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  name: { type: String },
  last_message_id: { type: Schema.Types.ObjectId, ref: 'Message' },
  icon: { type: String },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;