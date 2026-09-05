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
  assert.equal((await request('/api/auth/signup', 'POST', { name: 'Fake Admin', email: 'evil@test.example', password: 'test-password-123', role: 'ADMIN' })).status, 400);
  for (const path of ['/api/payments/orders', '/api/payments/confirm', '/api/supports']) {
    assert.equal((await request(path, 'POST', { orderId: 'fake', paymentKey: 'fake' })).status, 503);
  }
  assert.equal((await request('/api/admin/pg-status', 'GET', null, admin.body.token)).body.ready, false);
  await request('/api/auth/logout', 'POST', {}, admin.body.token);
  assert.equal((await request('/api/auth/me', 'GET', null, admin.body.token)).status, 401);
  console.log('PASS: admin authorization, signup hashing, persistent sessions, logout, invalid credentials, PG fail-closed.');
} finally {
  await new Promise(resolve => server.close(resolve));
  db.close();
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}
