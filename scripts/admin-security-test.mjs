import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { createClient } = require('@libsql/client');
const dir = await mkdtemp(join(tmpdir(), 'cssp-security-'));
const url = pathToFileURL(join(dir, 'test.db')).href;
Object.assign(process.env, {
  VERCEL: '1', TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: 'local-test',
  ADMIN_EMAIL: 'admin@test.example', ADMIN_PASSWORD: 'test-password-123',
  DOTENV_CONFIG_PATH: join(dir, 'absent.env')
});
const db = createClient({ url });
await db.executeMultiple(await readFile(new URL('../apps/api/prisma/turso-schema.sql', import.meta.url), 'utf8'));
const { default: app } = await import('../apps/api/dist/server.js');
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
async function request(path, method = 'GET', body, token) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
try {
  assert.equal((await request('/api/admin/users')).status, 401);
  assert.equal((await request('/api/supports')).status, 401);
  const admin = await request('/api/auth/login', 'POST', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  assert.equal(admin.status, 200);
  assert.equal(admin.body.user.role, 'ADMIN');
  assert.equal((await request('/api/admin/users', 'GET', null, admin.body.token)).status, 200);
  const { default: secondApp } = await import('../apps/api/dist/server.js?second-instance');
  const secondServer = secondApp.listen(0, '127.0.0.1');
  await new Promise(resolve => secondServer.once('listening', resolve));
  try {
    const crossInstance = await fetch(`http://127.0.0.1:${secondServer.address().port}/api/admin/users`, {
      headers: { Authorization: `Bearer ${admin.body.token}` }
    });
    assert.equal(crossInstance.status, 200);
  } finally { await new Promise(resolve => secondServer.close(resolve)); }
  assert.equal((await request('/api/admin/settings', 'POST', { commissionRate: 'bad' }, admin.body.token)).status, 400);
  assert.equal((await request('/api/auth/login', 'POST', { email: process.env.ADMIN_EMAIL, password: 'wrong' })).status, 401);
  const fan = await request('/api/auth/signup', 'POST', { name: 'Test Fan', email: 'fan@test.example', password: 'test-password-123', role: 'FAN' });
  assert.equal(fan.status, 201);
  assert.equal((await request('/api/auth/me', 'GET', null, fan.body.token)).status, 200);
  assert.equal((await request('/api/admin/users', 'GET', null, fan.body.token)).status, 403);
  assert.equal((await request('/api/auth/login', 'POST', { email: 'fan@test.example', password: 'test-password-123' })).status, 200);
  const stored = await db.execute("SELECT passwordHash FROM User WHERE email = 'fan@test.example'");
  assert.match(stored.rows[0].passwordHash, /^\$2/);
  const creator = await request('/api/auth/signup', 'POST', {
    name: 'Test Creator', email: 'creator@test.example', password: 'creator-password', role: 'CREATOR',
    bio: 'My saved introduction', photoUrls: ['https://example.com/profile.webp'],
    bankName: 'Test Bank', accountHolder: 'Test Creator', accountNumber: '123456789', instagramId: 'test.creator'
  });
  assert.equal(creator.status, 201);
  assert.equal(creator.body.user.role, 'CREATOR');
  const profile = await request('/api/creators/me/profile', 'GET', null, creator.body.token);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.bio, 'My saved introduction');
  assert.equal(profile.body.bankName, 'Test Bank');
  assert.equal(profile.body.accountNumber, '123456789');
  assert.equal((await request('/api/creators/me/profile', 'GET', null, fan.body.token)).status, 403);
  assert.equal((await request('/api/creators/me/orders', 'GET', null, fan.body.token)).status, 403);
  const creatorLogin = await request('/api/auth/login', 'POST', { email: 'creator@test.example', password: 'creator-password' });
  assert.equal(creatorLogin.status, 200);
  assert.equal(creatorLogin.body.user.id, creator.body.user.id);
  assert.equal((await request('/api/creators/me/profile', 'GET', null, creatorLogin.body.token)).body.bio, 'My saved introduction');
  const creatorProfile = await db.execute({ sql: 'SELECT id FROM CreatorProfile WHERE userId = ?', args: [creator.body.user.id] });
  const now = new Date().toISOString();
  await db.execute({
    sql: 'INSERT INTO DigitalOrder (id, orderNo, creatorId, fanId, purchaserName, purchaserEmail, message, pointAmount, paymentProvider, paymentKey, status, commissionRate, adminFee, creatorPayout, payoutStatus, paidAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: ['test-order-id', 'test-order-no', creatorProfile.rows[0].id, fan.body.user.id, 'Test Fan', 'fan@test.example', 'Test support message', 10000, 'NICEPAY', 'test-payment-key', 'PAID', 25, 2500, 7500, 'PENDING', now, now, now]
  });
  const creatorOrders = await request('/api/creators/me/orders', 'GET', null, creatorLogin.body.token);
  assert.equal(creatorOrders.status, 200);
  assert.equal(creatorOrders.body.length, 1);
  assert.equal(creatorOrders.body[0].fanName, 'Test Fan');
  assert.equal(creatorOrders.body[0].creatorPayout, 7500);
  const fanOrders = await request('/api/fan/orders', 'GET', null, fan.body.token);
  assert.equal(fanOrders.status, 200);
  assert.equal(fanOrders.body[0].message, 'Test support message');
  const adminPayments = await request('/api/admin/payments', 'GET', null, admin.body.token);
  assert.equal(adminPayments.status, 200);
  assert.equal(adminPayments.body[0].amount, 10000);
  const wallets = await db.execute({ sql: 'SELECT balance FROM PointWallet WHERE userId IN (?, ?)', args: [fan.body.user.id, creator.body.user.id] });
  assert.equal(wallets.rows.length, 2);
  assert.ok(wallets.rows.every(row => row.balance === 0));
  assert.equal((await request('/api/auth/signup', 'POST', { name: 'Fake Admin', email: 'evil@test.example', password: 'test-password-123', role: 'ADMIN' })).status, 400);
  for (const path of ['/api/payments/orders', '/api/payments/confirm', '/api/supports']) {
    assert.equal((await request(path, 'POST', { orderId: 'fake', paymentKey: 'fake' })).status, 503);
  }
  assert.equal((await request('/api/admin/pg-status', 'GET', null, admin.body.token)).body.ready, false);
  await request('/api/auth/logout', 'POST', {}, admin.body.token);
  assert.equal((await request('/api/auth/me', 'GET', null, admin.body.token)).status, 401);
  console.log('PASS: fan/creator signup, profile and wallet persistence, role access, support history, admin monitoring, sessions, logout, invalid credentials, PG fail-closed.');
} finally {
  await new Promise(resolve => server.close(resolve));
  db.close();
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}
