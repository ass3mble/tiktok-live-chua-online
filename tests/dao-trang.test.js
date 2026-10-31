const test = require('node:test');
const assert = require('node:assert/strict');
const { DaoTrang, skinFromText } = require('../lib/dao-trang');

test('Chỉ nhận đúng câu lệnh đổi trang phục, không hiểu nhầm Nam mô', () => {
  assert.equal(skinFromText('nam'), 'man');
  assert.equal(skinFromText('nữ'), 'woman');
  assert.equal(skinFromText('sư'), 'monk');
  assert.equal(skinFromText('ni'), 'nun');
  assert.equal(skinFromText('tiểu'), 'child');
  assert.equal(skinFromText('bà'), 'granny');
  assert.equal(skinFromText('cao tăng'), 'master');
  assert.equal(skinFromText('Nam mô A Di Đà Phật'), null);
  assert.equal(skinFromText('Anh mong gia đình bình an'), null);
});

test('Người bình luận được an tọa, thay trang phục và không bị nhân đôi khi bình luận tiếp', () => {
  const events = [];
  const room = new DaoTrang(event => events.push(event));
  room.chat({ id: 'id01', name: 'Minh Tâm', text: 'Cầu bình an' });
  room.chat({ id: 'id01', name: 'Minh Tâm', text: 'nữ' });
  assert.equal(room.viewers.size, 1);
  assert.equal(room.snapshot().viewers[0].skin, 'woman');
  assert.deepEqual(events.filter(e => e.type === 'join').length, 1);
  assert.deepEqual(events.filter(e => e.type === 'skin').length, 1);
});

test('Đạo tràng tự mở rộng 24, 36, 64, 100 bồ đoàn, giới hạn tối đa 100', () => {
  const room = new DaoTrang();
  assert.equal(room.capacity(), 24);
  room.fillDemo(25);
  assert.equal(room.capacity(), 36);
  room.fillDemo(64);
  assert.equal(room.capacity(), 64);
  room.fillDemo(100);
  assert.equal(room.capacity(), 100);
  room.join('nguoi-moi', 'Người Mới');
  assert.equal(room.viewers.size, 100);
});

test('Quà tặng tăng đúng số xu, bảng ngồi không tạo trùng, người tặng được ưu tiên giữ chỗ', () => {
  const room = new DaoTrang();
  room.gift({ id: 'nguoi1', name: 'Ngọc Lan', coins: 30, giftName: 'Đèn hoa sen' });
  room.gift({ id: 'nguoi1', name: 'Ngọc Lan', coins: 1, giftName: 'Hoa hồng' });
  assert.equal(room.viewers.size, 1);
  assert.equal(room.viewers.get('nguoi1').coins, 31);
  room.fillDemo(100);
  room.join('nguoi2', 'Khách Mới');
  assert.equal(room.viewers.get('nguoi1').coins, 31);
});

test('Xóa người thử không xóa người xem thật và chỉnh cài đặt có giới hạn', () => {
  const room = new DaoTrang();
  room.join('viewer1', 'Khách Thật');
  room.fillDemo(16);
  room.changeSettings({ seatMode: '100', moBpm: 100000, chantEveryMin: -5, music: false });
  assert.equal(room.settings.seatMode, '100');
  assert.equal(room.settings.moBpm, 120);
  assert.equal(room.settings.chantEveryMin, 1);
  assert.equal(room.settings.music, false);
  room.clearDemo();
  assert.equal(room.viewers.size, 1);
  assert.equal(room.viewers.get('viewer1').name, 'Khách Thật');
});

test('Khi thu hẹp đạo tràng sẽ giảm số người đúng sức chứa, ưu tiên giữ người tặng quà', () => {
  const room = new DaoTrang();
  room.gift({ id: 'nguoi-quy', name: 'Người tặng quà', coins: 50 });
  room.fillDemo(36);
  room.changeSettings({ seatMode: '24' });
  assert.equal(room.capacity(), 24);
  assert.equal(room.viewers.size, 24);
  assert.ok(room.viewers.has('nguoi-quy'));
  room.join('khach-moi', 'Khách mới');
  assert.equal(room.viewers.size, 24);
});

test('Tên đạo tràng và lời giới thiệu thay đổi được, không chèn ký tự đánh dấu', () => {
  const room = new DaoTrang();
  room.changeSettings({ title: 'Hoa Sen An Lạc<script>', subtitle: 'Cầu bình an <img>', autoChant: false });
  assert.equal(room.settings.title, 'Hoa Sen An Lạcscript');
  assert.equal(room.settings.subtitle, 'Cầu bình an img');
});

test('Lấp người mẫu không đuổi người xem thật khi giới hạn chỗ, ưu tiên người thật', () => {
  const room = new DaoTrang();
  room.changeSettings({ seatMode: '24' });
  for (let i = 0; i < 10; i++) room.join(`khach-${i}`, `Khách ${i}`);
  room.fillDemo(100);
  assert.equal(room.viewers.size, 24);
  assert.equal([...room.viewers.values()].filter(v => v.demo).length, 14);
  for (let i = 0; i < 10; i++) assert.ok(room.viewers.has(`khach-${i}`));
  room.join('khach-11', 'Khách mới');
  assert.equal(room.viewers.size, 24);
  for (let i = 0; i < 10; i++) assert.ok(room.viewers.has(`khach-${i}`));
});
