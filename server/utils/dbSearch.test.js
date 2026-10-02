const test = require('node:test');
const assert = require('node:assert/strict');
const { containsText, isPostgres } = require('./dbSearch');

test('Postgres URLs get a case-insensitive match', () => {
  assert.deepEqual(containsText('wash', 'postgresql://u:p@host:5432/db'), { contains: 'wash', mode: 'insensitive' });
  assert.deepEqual(containsText('wash', 'postgres://u:p@host/db'), { contains: 'wash', mode: 'insensitive' });
});

test('SQLite URLs get a plain contains (mode is invalid there)', () => {
  assert.deepEqual(containsText('wash', 'file:/home/x/app.db'), { contains: 'wash' });
  assert.equal(isPostgres(''), false);
});
