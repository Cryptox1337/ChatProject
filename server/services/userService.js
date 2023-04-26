const User = require('../models/UsersModel');
const Ban = require('../models/BansModel');

async function getUniqueTag(username) {
  const usersWithSameUsername = await User.find({ username });
  let tag = null;
  for (let i = 1; i <= 9999; i++) {
    const paddedTag = i.toString().padStart(4, '0'); // pad tag with leading zeros if necessary
    if (!usersWithSameUsername.some(user => user.tag === paddedTag)) {
      tag = paddedTag;
      break;
    }
  }
  return tag;
}

async function checkBanStatus(user) {
    const isBanned = await Ban.findOne({ user: user._id, unbannedAt: { $exists: false }, permanent: true });
  
    if (isBanned) {
      return { isBanned: true, type: 'permanently', reason: isBanned.reason };
    }
  
    const activeBans = await Ban.find({ user: user._id, unbannedAt: { $exists: true, $gte: new Date() } })
      .sort({ unbannedAt: -1 })
      .limit(1);
  
    if (activeBans.length > 0) {
      const { reason, unbannedAt, unbannedAtFormatted = unbannedAt.toLocaleString(), expiresIn = Math.floor((unbannedAt - new Date()) / 1000), type = (expiresIn === 0 ? 'permanently' : 'temporarily') } = activeBans[0];
  
      return { isBanned: true, type, reason, unbannedAtFormatted, expiresIn };
    }
  
    return { isBanned: false, type: null, reason: null, unbannedAtFormatted: null, expiresIn: null };
  }

module.exports = {
  getUniqueTag,
  checkBanStatus,
};
