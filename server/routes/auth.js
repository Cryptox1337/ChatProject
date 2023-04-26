const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getUniqueTag } = require('../services/userService');
const User = require('../models/UsersModel');
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

  const user = await User.findOne({ email });
  if (!user) {return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Invalid email or password' });}

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Invalid email or password' });}

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;
