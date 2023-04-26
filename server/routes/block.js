const express = require('express');
const router = express.Router();
const User = require('../models/UsersModel');
const { auth } = require('../middlewares/auth');
const { HTTP_STATUS_CODES } = require('../constants');

// Block user by user ID
router.post('/:id', auth(), async (req, res) => {
  const userID = req.userId;
  const targetId = req.params.id;

  if (userID === targetId) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'You cannot block yourself' });}

  try {
    // Check if the user to be blocked exists
    const targetUser = await User.findById(targetId);
    if (!targetUser) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}

    const currentUser = await User.findById(userID);
    if (!currentUser) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}

    // Check if the user is already blocked
    if (currentUser.blocked.includes(targetId)) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'User is already blocked' });}

    // Block the user
    currentUser.blocked.push(targetId);

    // Remove from Friend list
    currentUser.friends = currentUser.friends.filter(friend => friend.toString() !== targetId);
    await currentUser.save();

    // Remove from Friend list
    targetUser.friends = targetUser.friends.filter(friend => friend.toString() !== userID);
    await targetUser.save();

    // Delete all friend requests between the two users
    await FriendRequest.deleteMany({$or: [{ sender: userID, receiver: targetId },{ sender: targetId, receiver: userID }]});

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

// Unblock user by user ID
router.delete('/:id', auth(), async (req, res) => {
  const userID = req.userId;
  const targetId = req.params.id;

  try {
    // Check if the user to be unblocked exists
    const targetUser = await User.findById(targetId);
    if (!targetUser) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}

    const User = await User.findById(userID);
    if (!User) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}

    // Check if the user is blocked
    if (!User.blocked.includes(targetId)) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'User is not blocked' });}

    // Unblock the user
    User.blocked = User.blocked.filter(blockedUser => blockedUser.toString() !== targetId);
    await User.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

// Get all Blocked Users
router.get('/', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('blockedUsers');
    res.json(user.blockedUsers);
  } catch (error) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;