import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import { CreateSupportSchema, maskAddress } from '@cssp/shared';
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') ?? '*' }));
app.use(express.json());
const creators = [
    { id: 'cr_1', slug: 'hana', displayName: '하나 크리에이터', bio: '일상·뷰티 콘텐츠를 만드는 크리에이터입니다.', safeAddress: '서울특별시 강남구 테헤란로 123 10층', wishlist: [
            { id: 'wi_1', title: '촬영용 조명', price: 49000, imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800' },
            { id: 'wi_2', title: '카페 작업 후원', price: 15000, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' }
        ] },
    { id: 'cr_2', slug: 'min', displayName: '민 게임즈', bio: '게임 방송과 리뷰를 합니다.', safeAddress: '부산광역시 해운대구 센텀중앙로 55', wishlist: [
            { id: 'wi_3', title: '방송 소품 후원', price: 30000, imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' }
        ] }
];
const supports = [];
const notifications = [];
app.get('/health', (_req, res) => res.json({ ok: true, service: 'creator-safe-support-api' }));
app.get('/api/creators', (_req, res) => res.json(creators.map(({ safeAddress, ...c }) => c)));
app.get('/api/creators/:slug', (req, res) => {
    const creator = creators.find(c => c.slug === req.params.slug || c.id === req.params.slug);
    if (!creator)
        return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
    const { safeAddress, ...safe } = creator;
    res.json({ ...safe, addressMasked: maskAddress(safeAddress) });
});
app.post('/api/supports', (req, res) => {
    const parsed = CreateSupportSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const input = parsed.data;
    const creator = creators.find(c => c.id === input.creatorId);
    if (!creator)
        return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
    const support = { id: `sp_${nanoid(8)}`, ...input, status: 'PAID', paymentKey: `mock_${nanoid(10)}`, createdAt: new Date().toISOString() };
    supports.unshift(support);
    notifications.unshift({ id: `nt_${nanoid(8)}`, creatorId: creator.id, channel: 'KAKAO_ALIMTALK', title: '새 후원이 도착했습니다', body: `${input.supporterName}님이 ${input.amount.toLocaleString()}원을 후원했습니다.`, createdAt: new Date().toISOString() });
    res.status(201).json(support);
});
app.get('/api/supports', (_req, res) => res.json(supports));
app.get('/api/admin/summary', (_req, res) => res.json({ creators: creators.length, supports: supports.length, revenue: supports.reduce((s, x) => s + x.amount, 0), openReports: 0, pendingSettlements: supports.filter(s => s.status === 'PAID').length }));
app.get('/api/notifications', (_req, res) => res.json(notifications));
app.post('/api/reports', (req, res) => res.status(201).json({ id: `rp_${nanoid(8)}`, status: 'OPEN', ...req.body, createdAt: new Date().toISOString() }));
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
