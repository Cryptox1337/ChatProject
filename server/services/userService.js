const User = require('../models/UsersModel');

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

module.exports = {
  getUniqueTag,
};
