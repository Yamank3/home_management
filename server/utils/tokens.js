const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TTL = '15m';
const REFRESH_TTL = '60d';

// Fingerprint of the current password hash. Embedded in refresh tokens so that
// changing a password revokes every outstanding session without a token table.
const pwFingerprint = (user) =>
  crypto.createHash('sha256').update(user.password).digest('hex').slice(0, 16);

function signAccess(user) {
  return jwt.sign(
    { typ: 'access', userId: user.id, householdId: user.householdId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { typ: 'refresh', userId: user.id, pw: pwFingerprint(user) },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

// Throws if the token is invalid, expired, or not of the expected type.
function verify(token, typ) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.typ !== typ) throw new Error('Wrong token type');
  return payload;
}

const issueTokens = (user) => ({ accessToken: signAccess(user), refreshToken: signRefresh(user) });

module.exports = { issueTokens, verify, pwFingerprint };
