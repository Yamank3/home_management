// Prisma's `contains` is case-sensitive on Postgres but SQLite's LIKE already
// ignores case, and `mode` is only accepted on Postgres. This keeps text searches
// behaving the same in local SQLite and on Railway Postgres.
const isPostgres = (url = process.env.DATABASE_URL || '') => /^postgres(ql)?:/.test(url);

const containsText = (text, url) => ({ contains: text, ...(isPostgres(url) && { mode: 'insensitive' }) });

module.exports = { containsText, isPostgres };
