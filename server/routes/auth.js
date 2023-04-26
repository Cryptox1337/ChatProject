const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getUniqueTag, checkBanStatus } = require('../services/userService');
const User = require('../models/UsersModel');
const Ban = require('../models/BansModel');
const { auth } = require('../middlewares/auth');
const { HTTP_STATUS_CODES } = require('../constants');

router.post('/register', async (req, res) => {
  const { email, username, password, birthday } = req.body;

  if (!email || !username || !password || !birthday) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'All fields are required' });}

  const existingUser = await User.findOne({ email });
  if (existingUser) {return res.status(HTTP_STATUS_CODES.CONFLICT).json({ error: 'Email already registered' });}

  const tag = await getUniqueTag(username);
  if (!tag) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Username is taken, please choose a different username' });}

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, username, password: hashedPassword, birthday, tag });
    await newUser.save();
    res.status(HTTP_STATUS_CODES.CREATED).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Email and password are required' });}

  try {
    const user = await User.findOne({ email });
    if (!user) {return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Invalid email or password' });}

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Invalid email or password' });}

    const { isBanned, type, reason, formattedUnbannedAt, expiresIn } = await checkBanStatus(user);
    if (isBanned) {
      if (type === 'permanently') {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: `This user is banned permanently. Reason: ${reason}` });
      } else {
        const error = `This user is banned temporarily until ${formattedUnbannedAt}. Reason(s): ${reason}`;
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error, expiresIn });
      }
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' })
    res.json({ token});
  } catch (error) {
    console.error(error);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});


router.post('/logout', auth(), (req, res) => {
  res.clearCookie('jwtToken');
  res.status(HTTP_STATUS_CODES.OK).json({ message: 'Logged out successfully' });
});

// Route for deleting a user
router.delete('/:userId', auth, async (req, res) => {
  try {
    if (req.params.userId !== req.userId) {return res.status(HTTP_STATUS_CODES.FORBIDDEN).json({ error: 'You are not authorized to delete this user' });}

    const user = await User.findById(req.userId);
    if (!user) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}

    await User.findByIdAndDelete(req.userId);

    res.status(HTTP_STATUS_CODES.OK).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.post('/:userId/ban/permanent', async (req, res) => {
  try {

    // Find the user to ban
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });
    }

    // Create a permanent ban for the user
    const ban = new Ban({
      user: user._id,
      reason: req.body.reason,
      permanent: true
    });
    await ban.save();

    res.status(HTTP_STATUS_CODES.OK).json({ message: 'User permanently banned successfully' });
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});

router.post('/:userId/ban/temporary', async (req, res) => {
  const { userId } = req.params;
  const { reason, durationInMinutes } = req.body;

  // Make sure the user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });
  }

  // Calculate the unbannedAt date
  const bannedAt = new Date();
  const durationInMilliseconds = durationInMinutes * 60 * 1000;
  const unbannedAt = new Date(bannedAt.getTime() + durationInMilliseconds);

  // Create a new ban record
  const ban = new Ban({
    user: userId,
    reason,
    bannedAt,
    unbannedAt,
    permanent: false
  });

  try {
    // Save the ban record
    await ban.save();

    res.status(HTTP_STATUS_CODES.OK).json({ message: 'User banned temporarily' });
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
