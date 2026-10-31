const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveTikTokUsername } = require('../lib/tiktok-input');

test('Nhận tên tài khoản và liên kết TikTok chuẩn', async () => {
  assert.equal(await resolveTikTokUsername('@my_channel.01'), 'my_channel.01');
  assert.equal(await resolveTikTokUsername('https://www.tiktok.com/@test.123/live'), 'test.123');
  assert.equal(await resolveTikTokUsername('tiktok.com/@hello_01'), 'hello_01');
});

test('Không tự gọi mạng nội bộ hoặc miền giả mạo', async () => {
  let calls = 0;
  const neverFetch = () => { calls++; throw new Error('Không được gọi tới URL này'); };
  await assert.rejects(resolveTikTokUsername('http://127.0.0.1:3000/?tiktok.com/@admin', neverFetch), /tiktok.com/);
  await assert.rejects(resolveTikTokUsername('https://tiktok.com.evil.example/@someone', neverFetch), /tiktok.com/);
  await assert.rejects(resolveTikTokUsername('file:///etc/passwd', neverFetch), /tiktok.com/);
  assert.equal(calls, 0);
});

test('Rút gọn liên kết TikTok qua chuyển hướng có kiểm tra từng địa chỉ', async () => {
  const validFetch = async () => ({ status: 302, body: null,
    headers: { get: name => name === 'location' ? 'https://www.tiktok.com/@live_123' : null } });
  assert.equal(await resolveTikTokUsername('https://vm.tiktok.com/ABCD/', validFetch), 'live_123');
  const invalidFetch = async () => ({ status: 302, body: null,
    headers: { get: () => 'http://127.0.0.1:3000/reset' } });
  await assert.rejects(resolveTikTokUsername('https://vm.tiktok.com/ABCD/', invalidFetch), /chuyển hướng/);
});
