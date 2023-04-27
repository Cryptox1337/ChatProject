const mongoose = require('mongoose');
const { Schema } = mongoose;

const serverSchema = new Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  icon: { type: String }
});

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;