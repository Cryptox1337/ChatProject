const express = require('express');
const router = express.Router();
const User = require('../models/UsersModel');
const FriendRequest = require('../models/FriendRequestsModel');
const { auth } = require('../middlewares/auth');
const { HTTP_STATUS_CODES } = require('../constants');

// Add friend by user ID
router.post('/add/:id', auth(), async (req, res) => {
  const senderId = req.userId;
  const receiverId = req.params.id;

  if (senderId === receiverId) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Sender and receiver cannot be the same user' });}

  const receiver = await User.findById(receiverId);
  if (!receiver) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Receiver not found' });}

  try {
    // Check if there is an active friend request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });
    if (existingRequest) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Friend request already exists' });}

    // Create a new friend request
    const newRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
    });
    await newRequest.save();

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

// Deny friend request by request ID
router.post('/deny/:id', auth(), async (req, res) => {
    const requestId = req.params.id;
  
    try {
      const request = await FriendRequest.findById(requestId);
      if (!request) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend request not found' });}
  
      // Check if the authenticated user is the receiver of the friend request
      if (request.receiver.toString() !== req.userId) {
        return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ error: 'You are not authorized to deny this friend request' });
      }
  
      await request.remove();
  
      res.json({ message: 'Friend request denied' });
    } catch (error) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

// Accept friend request by request ID
router.post('/accept/:id', auth(), async (req, res) => {
    const requestId = req.params.id;
  
    try {
      const request = await FriendRequest.findById(requestId);
      if (!request) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend request not found' });}
  
      // Check if the authenticated user is the receiver of the friend request
      if (request.receiver.toString() !== req.userId) {return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ error: 'You are not authorized to accept this friend request' });}
  
      // Add the sender to the receiver's friend list
      const receiver = await User.findById(request.receiver);
      const sender = await User.findById(request.sender);
      receiver.friends.push(sender._id);
      await receiver.save();
  
      // Add the receiver to the sender's friend list
      sender.friends.push(receiver._id);
      await sender.save();
  
      // Remove the friend request
      await request.remove();
  
      res.json({ message: 'Friend request accepted' });
    } catch (error) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  });

// Revoke friend request by request ID
router.delete('/revoke/:id', auth(), async (req, res) => {
    const requestId = req.params.id;
  
    try {
      const request = await FriendRequest.findById(requestId);
      if (!request) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend request not found' });}
  
      // Check if the authenticated user is the sender of the friend request
      if (request.sender.toString() !== req.userId) {return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ error: 'You are not authorized to revoke this friend request' });}
  
      await request.remove();
  
      res.json({ message: 'Friend request revoked' });
    } catch (error) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

// Remove friend by user ID
router.post('/remove/:id', auth(), async (req, res) => {
    const userId = req.userId;
    const friendId = req.params.id;
  
    if (userId === friendId) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'User and friend cannot be the same user' });}
  
    try {
      const user = await User.findById(userId);
      if (!user) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}
  
      const friend = await User.findById(friendId);
      if (!friend) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'Friend not found' });}
  
      // Check if the friend is in the user's friend list
      if (!user.friends.includes(friendId)) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Friend not in user\'s friend list' });}
  
      // Remove the friend from the user's friend list
      user.friends.pull(friendId);
      await user.save();
  
      // Remove the user from the friend's friend list
      friend.friends.pull(userId);
      await friend.save();
  
      res.json({ message: 'Friend removed' });
    } catch (error) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

// Get all friends of the authenticated user
router.get('/friends', auth(), async (req, res) => {
    const userId = req.userId;
  
    try {
      const user = await User.findById(userId).populate('friends');
      if (!user) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}
  
      const friends = user.friends;
      res.json({ friends });
    } catch (error) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

// Get all friend requests
router.get('/requests', auth(), async (req, res) => {
    const userId = req.userId;
    
    try {
      const requests = await FriendRequest.find({ receiver: userId }).populate('sender', 'name email');
      res.json(requests);
    } catch (error) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;