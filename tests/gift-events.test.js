const test = require('node:test');
const assert = require('node:assert/strict');
const { GiftEventCounter } = require('../lib/gift-events');

test('Tặng quà đơn lẻ, mỗi sự kiện được tính một lần', () => {
  const counter = new GiftEventCounter();
  assert.equal(counter.count({}, 'user1', 'rose'), 1);
  assert.equal(counter.count({}, 'user1', 'rose'), 1);
});

test('Chuỗi quà liên tiếp chỉ tính phần tăng thêm và không nhân đôi lúc kết thúc', () => {
  let now = 1000;
  const counter = new GiftEventCounter(() => now);
  assert.equal(counter.count({ groupId: 'group1', repeatCount: 1, repeatEnd: false }, 'user1', 'rose'), 1);
  assert.equal(counter.count({ groupId: 'group1', repeatCount: 3, repeatEnd: false }, 'user1', 'rose'), 2);
  assert.equal(counter.count({ groupId: 'group1', repeatCount: 3, repeatEnd: true }, 'user1', 'rose'), 0);
  assert.equal(counter.count({ groupId: 'group1', repeatCount: 3, repeatEnd: true }, 'user1', 'rose'), 0);
  now += 11000;
  assert.equal(counter.count({ groupId: 'group1', repeatCount: 1, repeatEnd: false }, 'user1', 'rose'), 1);
});

test('Không trộn các nhóm quà của người xem khác nhau', () => {
  const counter = new GiftEventCounter();
  assert.equal(counter.count({ groupId: 'abc', repeatCount: 2 }, 'user1', 'rose'), 2);
  assert.equal(counter.count({ groupId: 'abc', repeatCount: 2 }, 'user2', 'rose'), 2);
});

test('Hai món quà đơn lẻ không có dấu nhóm không bị tính thiếu', () => {
  const counter = new GiftEventCounter();
  assert.equal(counter.count({ repeatEnd: true }, 'user1', 'rose'), 1);
  assert.equal(counter.count({ repeatEnd: true }, 'user1', 'rose'), 1);
});

test('Chuỗi quà không có mã nhóm chỉ tính bản tin kết thúc', () => {
  const counter = new GiftEventCounter();
  const base = { giftDetails: { giftType: 1 }, repeatEnd: false };
  assert.equal(counter.count({ ...base, repeatCount: 1 }, 'u', 'g'), 0);
  assert.equal(counter.count({ ...base, repeatCount: 3 }, 'u', 'g'), 0);
  assert.equal(counter.count({ ...base, repeatCount: 3, repeatEnd: true }, 'u', 'g'), 3);
});

test('Quà kiểu dữ liệu rút gọn TikTok không cộng bản tin đang chạy, không nhân đôi cùng mã tin', () => {
  const counter = new GiftEventCounter();
  const props = { gift: { gift_type: 1, repeat_count: 5, repeat_end: 0 } };
  assert.equal(counter.count(props, 'u', 'g'), 0);
  const finalEvent = { gift: { gift_type: 1, repeat_count: 5, repeat_end: 1 },
    common: { msgId: '1234' } };
  assert.equal(counter.count(finalEvent, 'u', 'g'), 5);
  assert.equal(counter.count(finalEvent, 'u', 'g'), 0);
});
