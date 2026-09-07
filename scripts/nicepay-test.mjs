import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { installNicepay } from '../apps/api/dist/nicepay-routes.js';
import { digest, nicepayConfig, verifyTransaction } from '../apps/api/dist/nicepay.js';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const express = require('express');
const { createClient } = require('@libsql/client');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const dir = await mkdtemp(join(tmpdir(), 'cssp-nicepay-'));
const url = pathToFileURL(join(dir, 'test.db')).href;
const raw = createClient({ url });
await raw.executeMultiple(await readFile(new URL('../apps/api/prisma/turso-schema.sql', import.meta.url), 'utf8'));
const prisma = new PrismaClient({ adapter: new PrismaLibSQL({ url }) });
Object.assign(process.env, { NICEPAY_MODE: 'sandbox', NICEPAY_CLIENT_ID: 'S2_local_test', NICEPAY_SECRET_KEY: 'local-test-only', PUBLIC_APP_URL: 'https://shop.example', NICEPAY_LIVE_ENABLED: 'false' });
const config = nicepayConfig();
assert.equal(nicepayConfig({}).ready, false);
assert.equal(nicepayConfig({ ...process.env, NICEPAY_MODE: 'production', NICEPAY_CLIENT_ID: 'R2_test' }).ready, false);
let approvals = 0, cancellations = 0, networkCancels = 0, dropApproval = false;
const transactions = new Map();
const sign = data => ({ ...data, ediDate: '2026-09-05T12:00:00+0900', currency: 'KRW', resultCode: '0000',
  signature: digest(`${data.tid}${data.amount}2026-09-05T12:00:00+0900${config.secretKey}`) });
const fakePG = async (url, options) => {
  assert.ok(url.startsWith('https://sandbox-api.nicepay.co.kr/v1/payments/'));
  const path = new URL(url).pathname;
  const payload = options.body ? JSON.parse(options.body) : undefined;
  if (path.endsWith('/netcancel')) {
    networkCancels++;
    const transaction = [...transactions.values()].find(item => item.orderId === payload.orderId);
    transaction.status = 'cancelled';
    return Response.json(sign(transaction));
  }
  const tid = path.split('/')[3];
  const transaction = transactions.get(tid);
  if (options.method === 'POST') {
    if (path.endsWith('/cancel')) { cancellations++; transaction.status = 'cancelled'; }
    else { approvals++; transaction.status = 'paid'; if (dropApproval) throw new Error('Read timeout'); }
  }
  return Response.json(sign(transaction));
};
const fan = await prisma.user.create({ data: { email: 'buyer@example.test', displayName: 'Buyer', role: 'FAN' } });
const creator = await prisma.creatorProfile.create({ data: { slug: 'test', displayName: 'Creator', handle: '@test', bio: 'Test', avatarUrl: '/test.png', coverUrl: '/test.png' } });
const product = await prisma.digitalProduct.create({ data: { creatorId: creator.id, title: 'Test digital item', pointPrice: 12000 } });
const app = express(); app.use(express.json());
installNicepay(app, { prisma, getRate: async () => 25, transport: fakePG,
  getUser: async req => req.header('authorization') === 'Bearer fan' ? { id: fan.id, role: 'FAN', name: 'Buyer', email: fan.email } : req.header('authorization') === 'Bearer admin' ? { id: fan.id, role: 'ADMIN', name: 'Admin', email: fan.email } : undefined });
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const request = async (path, body, token = 'fan', form = false) => {
  const response = await fetch(base + path, { redirect: 'manual', method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
    ...(body ? { body: form ? new URLSearchParams(body) : JSON.stringify(body) } : {}) });
  return { status: response.status, body: await response.json().catch(() => null), location: response.headers.get('location') };
};
const createOrder = async () => {
  const response = await request('/api/payments/checkout', { productId: product.id, creatorId: creator.id, amount: 1 });
  assert.equal(response.status, 201);
  assert.equal(response.body.amount, 12000);
  assert.equal(JSON.stringify(response.body).includes(config.secretKey), false);
  return response.body.orderId;
};
const callback = (orderId, tid) => ({ orderId, tid, amount: '12000', clientId: config.clientId, authResultCode: '0000', authToken: 'test-auth',
  signature: digest(`test-auth${config.clientId}12000${config.secretKey}`) });
try {
  assert.equal((await request('/api/payments/checkout', { productId: product.id, creatorId: creator.id }, 'missing')).status, 401);
  const orderId = await createOrder();
  const auth = callback(orderId, 'test_tid_1');
  transactions.set(auth.tid, { tid: auth.tid, orderId, amount: 12000, status: 'ready' });
  assert.equal((await request('/api/payments/return', { ...auth, signature: 'bad' }, 'fan', true)).status, 400);
  assert.equal(approvals, 0);
  assert.equal((await request('/api/payments/return', auth, 'fan', true)).status, 303);
  assert.equal((await request('/api/payments/return', auth, 'fan', true)).status, 303);
  assert.equal(approvals, 1);
  assert.equal((await request(`/api/payments/status?orderId=${orderId}`)).body.status, 'PAID');
  assert.equal((await request('/api/payments/webhook', { orderId, tid: auth.tid, status: 'cancelled' })).status, 200);
  assert.equal((await request(`/api/payments/status?orderId=${orderId}`)).body.status, 'PAID');
  assert.equal((await request('/api/admin/refund', { orderId, reason: 'Test' })).status, 403);
  assert.equal((await request('/api/admin/refund', { orderId, reason: 'Test' }, 'admin')).body.status, 'REFUNDED');
  assert.equal((await request('/api/admin/refund', { orderId, reason: 'Test' }, 'admin')).status, 200);
  assert.equal(cancellations, 1);
  const nextId = await createOrder();
  const nextAuth = callback(nextId, 'test_tid_2');
  transactions.set(nextAuth.tid, { tid: nextAuth.tid, orderId: nextId, amount: 12000, status: 'ready' });
  dropApproval = true;
  assert.equal((await request('/api/payments/return', nextAuth, 'fan', true)).status, 303);
  assert.equal(networkCancels, 1);
  assert.equal((await request(`/api/payments/status?orderId=${nextId}`)).body.status, 'REFUNDED');
  assert.throws(() => verifyTransaction(sign({ tid: auth.tid, orderId, amount: 1, status: 'paid' }), { tid: auth.tid, orderId, amount: 12000 }, config.secretKey));
  console.log('PASS: NICEPAY order pricing, authentication, signatures, duplicate callbacks, verified webhook, full refund, timeout network cancellation. No real PG requests.');
} finally {
  await new Promise(resolve => server.close(resolve));
  await prisma.$disconnect(); raw.close();
}
