const router = require('express').Router();
const Message = require('../models/MessagesModel');
const { auth } = require('../middlewares/auth');
const { HTTP_STATUS_CODES } = require('../constants');
const Channel = require('../models/ChannelModel');
const ServerMembers = require('../models/ServerMembersModel');

// GET messages for a channel
router.get('/:channelId/messages', auth(), async (req, res, next) => {
    const { channelId } = req.params;
    const { before, limit } = req.query;
  
    try {
      // Get the channel by ID
      const channel = await Channel.findById(channelId);
      if (!channel) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ message: 'Channel not found' });}
  
      if ((channel.type === 'DM' || channel.type === 'GROUP_DM') && !channel.recipients.includes(req.user._id)) {
        return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ message: 'User is not a recipient of this DM' });
      } else if (channel.server_id) {
        // Check if the requester is a member of the server
        const serverId = channel.server_id;
        const userId = req.user._id;
  
        const serverMember = await ServerMembers.findOne({ server: serverId, user: userId });
        if (!serverMember) {return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ message: 'You are not a member of this server' });}
      }
  
      // Get the messages for the channel, optionally filtered by "before" and "limit"
      let messagesQuery = Message.find({ channelId }).sort('-timestamp');
      if (before) {messagesQuery = messagesQuery.where('timestamp').lt(new Date(parseInt(before)));}

      if (limit) {messagesQuery = messagesQuery.limit(parseInt(limit));}
      const messages = await messagesQuery.exec();
  
      res.json({ messages });
    } catch (err) {
        console.error(error);
        res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});
  
  module.exports = router;
