const test = require('node:test');
const assert = require('node:assert/strict');
const { createAccess } = require('../lib/access');

const req = (origin, extra = {}, url = '/rpc') => ({
  headers: { host: '127.0.0.1:3000', ...(origin ? { origin } : {}), ...extra },
  url
});

test('Máy chủ mặc định chỉ dành cho máy cục bộ', () => {
  assert.equal(createAccess().host, '127.0.0.1');
  assert.throws(() => createAccess({ host: '0.0.0.0' }), /RPC_TOKEN/);
});

test('Từ chối yêu cầu đến từ trang web khác nguồn', () => {
  const access = createAccess();
  assert.equal(access.authorized(req('http://127.0.0.1:3000')), true);
  assert.equal(access.authorized(req('https://example.net')), false);
  assert.equal(access.authorized(req(null)), true);
  assert.equal(access.authorized(req('http://website-la.example:3000', { host: 'website-la.example:3000' })), false);
  assert.equal(access.authorized(req(null, { host: 'website-la.example:3000' })), false);
  assert.equal(access.authorized(req('http://localhost:3000', { host: 'localhost:3000' })), true);
});

test('Bắt buộc mã truy cập khi lắng nghe trên mạng', () => {
  const access = createAccess({ host: '0.0.0.0', token: 'ma-kiem-tra' });
  assert.equal(access.allowedPageRequest(req('http://127.0.0.1:3000')), true);
  assert.equal(access.authorized(req('http://127.0.0.1:3000')), false);
  assert.equal(access.authorized(req('http://127.0.0.1:3000', { 'x-temple-key': 'ma-kiem-tra' })), true);
  assert.equal(access.authorized(req('http://127.0.0.1:3000', {}, '/ws?key=ma-kiem-tra')), true);
  assert.equal(access.authorized(req('https://example.net', { 'x-temple-key': 'ma-kiem-tra' })), false);
});
