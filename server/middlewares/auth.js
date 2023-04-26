const jwt = require('jsonwebtoken');
const { HTTP_STATUS_CODES } = require('../constants');

const auth = (roles) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Unauthorized access' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.role = decoded.role;

      if (roles && !roles.includes(req.role)) {
        return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Unauthorized access' });
      }

      next();
    } catch (error) {
      console.log(error)
      return res.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({ error: 'Invalid token' });
    }
  };
};

module.exports = {
  auth,
};