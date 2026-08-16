import fs from 'node:fs';
const required = ['apps/web/src/main.tsx','apps/api/src/server.ts','apps/api/prisma/schema.prisma','docs/requirements.md'];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
const web = fs.readFileSync('apps/web/src/main.tsx','utf8');
if (!web.includes('디지털 상품 주문이 접수되었습니다')) throw new Error('Web flow text missing');
const api = fs.readFileSync('apps/api/src/server.ts','utf8');
if (!api.includes('/api/supports')) throw new Error('API route missing');
console.log('Smoke tests passed.');
