const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getUniqueTag } = require('../services/userService');
const User = require('../models/UsersModel');

const HTTP_STATUS_CODES = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  CREATED: 201,
  INTERNAL_SERVER_ERROR: 500,
};

router.post('/register', async (req, res) => {
  const { email, username, password, birthday } = req.body;

  if (!email || !username || !password || !birthday) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'All fields are required' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(HTTP_STATUS_CODES.CONFLICT).json({ error: 'Email already registered' });
  }

  const tag = await getUniqueTag(username);
  if (!tag) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ error: 'Username is taken, please choose a different username' });
  }

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

module.exports = router;
