const jwt = require('jsonwebtoken');
const { HTTP_STATUS_CODES } = require('../constants');
const User = require('../models/UsersModel');


const auth = (roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Unauthorized access' });}

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({ error: 'User not found' });}
      req.user = user;

      if (roles && !roles.includes(user.role)) {return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Unauthorized access' });}

      next();
    } catch (error) {
      console.error(error)
      return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Invalid token' });
    }
  };
};

module.exports = {
  auth,
};