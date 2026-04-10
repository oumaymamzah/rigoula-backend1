const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  if (!password) {
    throw new Error('Password requis pour le hashage');
  }

  return bcrypt.hash(password, 10);
}

module.exports = hashPassword;