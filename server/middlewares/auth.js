const jwt = require('jsonwebtoken');
const { HTTP_STATUS_CODES } = require('../constants');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Unauthorized access' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
