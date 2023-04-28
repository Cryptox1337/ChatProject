const express = require('express');
const router = express.Router();
const User = require('../models/UsersModel');
const FriendRequest = require('../models/FriendRequestsModel');
const { auth } = require('../middlewares/auth');
const { HTTP_STATUS_CODES } = require('../constants');

// Block user by user ID
router.post('/:id', auth(), async (req, res) => {
  	try {
    	const targetUser = await User.findById(req.params.id);

    	// Check if the user to be blocked exists
    	if (!targetUser) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}

    	if (req.user.id === targetUser.id) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'You cannot block yourself' });}

    	// Check if the user is already blocked
    	if (req.user.blocked.includes(targetUser.id)) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'User is already blocked' });}

    	// Block the user
    	req.user.blocked.push(targetUser.id);

    	// Remove from Friend list
    	req.user.friends = req.user.friends.filter(friend => friend.toString() !== targetUser.id);
    	await req.user.save();

    	// Remove from Friend list
    	targetUser.friends = targetUser.friends.filter(friend => friend.toString() !== req.user.id);
    	await targetUser.save();

    	// Delete all friend requests between the two users
    	await FriendRequest.deleteMany({$or: [{ sender: req.user.id, receiver: targetUser.id },{ sender: targetUser.id, receiver: req.user.id }]});

    	res.json({ message: 'User blocked successfully' });
  	} catch (error) {
    	console.error(error)
    	res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  	}
});

// Unblock user by user ID
router.delete('/:id', auth(), async (req, res) => {
  	try {
    	const targetUser = await User.findById(req.params.id);

    	// Check if the user to be unblocked exists
    	if (!targetUser) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}

    	// Check if the user is blocked
    	if (!req.user.blocked.includes(targetUser.id)) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'User is not blocked' });}

    	// Unblock the user
    	req.user.blocked = req.user.blocked.filter(blockedUser => !blockedUser.equals(targetUser.id));
    	await req.user.save();

    	res.json({ message: 'User unblocked successfully' });
  	} catch (error) {
    	console.error(error)
    	res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  	}
});

// Get all Blocked Users
router.get('/', auth(), async (req, res) => {
  	try {
    	res.json(req.user.blocked);
  	} catch (error) {
    	console.error(error)
    	res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  	}
});

module.exports = router;