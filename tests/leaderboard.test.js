const test = require('node:test');
const assert = require('node:assert/strict');
const { topDevotees } = require('../lib/leaderboard');

test('Bảng 24 người dẫn đầu giữ nguyên điểm và thứ tự khi có nhiều người bằng điểm', () => {
  const devotees = {};
  for (let i = 0; i < 5000; i += 1) {
    devotees[`u:viewer-${i}`] = { name: `Người ${i}`, merit: (i * 37) % 101 };
  }
  // Bỏ qua thuộc tính kế thừa và giữ thứ tự giống Object.values + sort ổn định.
  Object.setPrototypeOf(devotees, { inherited: { name: 'Không hợp lệ', merit: 999999 } });
  const expected = Object.values(devotees)
    .sort((a, b) => b.merit - a.merit)
    .slice(0, 24);
  assert.deepEqual(topDevotees(devotees, 24), expected);
  assert.deepEqual(topDevotees(devotees, 1), expected.slice(0, 1));
  assert.deepEqual(topDevotees(devotees, 0), []);
});

test('Bảng công đức ít người vẫn xếp đúng tất cả vị trí', () => {
  const devotees = {
    'u:one': { name: 'Một', merit: 3 },
    'u:two': { name: 'Hai', merit: 5 },
    'u:three': { name: 'Ba', merit: 5 }
  };
  assert.deepEqual(topDevotees(devotees, 24).map(d => d.name), ['Hai', 'Ba', 'Một']);
});
