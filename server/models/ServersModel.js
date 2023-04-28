const mongoose = require('mongoose');
const { Schema } = mongoose;

const serverSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  icon: { type: String }
});

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;