const express = require('express');
const router = express.Router();
const User = require('../models/UsersModel');
const FriendRequest = require('../models/FriendRequestsModel');
const { auth } = require('../middlewares/auth');
const { HTTP_STATUS_CODES } = require('../constants');

// Add friend by user ID
router.post('/add/:id', auth(), async (req, res) => {
	try {
		const receiver = await User.findById(req.params.id);
		if (!receiver) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Receiver not found' });}

  		if (req.user.id === receiver.id) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Sender and receiver cannot be the same user' });}

  		// Check if sender is blocked by receiver or receiver is blocked by sender
  		if (receiver.blocked.includes(req.user.id) || req.user.blocked.includes(receiver.id)) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Cannot send friend request to a blocked user' });}

  		// Check if there is an active friend request
  		const existingRequest = await FriendRequest.findOne({$or: [{ sender: req.user.id, receiver: receiver.id },{ sender: receiver.id, receiver: req.user.id }]});
  		if (existingRequest) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Friend request already exists' });}

  		// Create a new friend request
  		const newRequest = new FriendRequest({sender: req.user.id, receiver: receiver.id});
		await newRequest.save();

		res.json({ message: 'Friend request sent' });
  	} catch (error) {
    	console.error(error)
    	res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  	}
});

// Deny friend request by request ID
router.post('/deny/:id', auth(), async (req, res) => {
    try {
      const request = await FriendRequest.findById(req.params.id);
      if (!request) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend request not found' });}
  
      // Check if the authenticated user is the receiver of the friend request
      if (request.receiver.toString() !== req.user.id) {return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ error: 'You are not authorized to deny this friend request' });}
  
      await request.remove();
  
      res.json({ message: 'Friend request denied' });
    } catch (error) {
      console.error(error)
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

// Accept friend request by request ID
router.post('/accept/:id', auth(), async (req, res) => {
    try {
      const request = await FriendRequest.findById(req.params.id);
      if (!request) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend request not found' });}
  
      // Check if the authenticated user is the receiver of the friend request
      if (request.receiver.toString() !== req.userId) {return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ error: 'You are not authorized to accept this friend request' });}
  
      // Add the sender to the receiver's friend list
      const receiver = await User.findById(request.receiver);
      const sender = await User.findById(request.sender);

	  // Add the sender to the receiver's friend list
      receiver.friends.push(sender.id);
      await receiver.save();
  
      // Add the receiver to the sender's friend list
      sender.friends.push(receiver.id);
      await sender.save();
  
      // Remove the friend request
      await request.remove();
  
      res.json({ message: 'Friend request accepted' });
    } catch (error) {
      console.error(error)
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  });

// Revoke friend request by request ID
router.delete('/revoke/:id', auth(), async (req, res) => {
    try {
      const request = await FriendRequest.findById(req.params.id);
      if (!request) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend request not found' });}
  
      // Check if the authenticated user is the sender of the friend request
      if (request.sender.toString() !== req.userId) {return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ error: 'You are not authorized to revoke this friend request' });}
  
      await request.remove();
  
      res.json({ message: 'Friend request revoked' });
    } catch (error) {
      console.error(error)
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

// Remove friend by user ID
router.post('/remove/:id', auth(), async (req, res) => {
	try {
		const friend = await User.findById(req.params.id);
		if (!friend) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend not found' });}
  
      	if (req.user.id === friend.id) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'User and friend cannot be the same user' });}
  
  
      	// Check if the friend is in the user's friend list
      	if (!req.user.friends.includes(friend.id)) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Friend not in user\'s friend list' });}
  
      	// Remove the friend from the user's friend list
      	req.user.friends.pull(friend.id);
      	await req.user.save();
  
      	// Remove the user from the friend's friend list
      	friend.friends.pull(req.user.id);
      	await friend.save();
  
      	res.json({ message: 'Friend removed' });
  	} catch (error) {
      	console.error(error)
      	res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  	}
});

// Get all friends of the authenticated user
router.get('/friends', auth(), async (req, res) => {
    try {
      res.json(req.user.friends);
    } catch (error) {
      console.error(error)
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

// Get all friend requests
router.get('/requests', auth(), async (req, res) => {
    try {
      const requests = await FriendRequest.find({ receiver: req.user.id }).populate('sender');
      res.json(requests);
    } catch (error) {
      console.error(error)
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;