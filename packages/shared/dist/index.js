import { z } from 'zod';
export const Role = z.enum(['FAN', 'CREATOR', 'ADMIN']);
export const MoneySchema = z.object({
    amount: z.number().int().positive(),
    currency: z.literal('KRW')
});
export const DigitalOrderStatus = z.enum(['PENDING_PAYMENT', 'PAID', 'PROVISIONING', 'ACTIVE', 'CANCELLED', 'REFUNDED']);
export const CreateDigitalOrderSchema = z.object({
    creatorId: z.string().min(1),
    wishlistItemId: z.string().optional(),
    supporterName: z.string().min(1).max(30),
    message: z.string().max(500).optional(),
    amount: z.number().int().min(1000),
    paymentProvider: z.enum(['NICEPAY', 'TOSS', 'KAKAO_PAY', 'PORTONE', 'MOCK'])
});
// Backward-compatible aliases for the existing API route while the database migration is staged.
export const GiftStatus = DigitalOrderStatus;
export const CreateSupportSchema = CreateDigitalOrderSchema;
export const CreatorProfileSchema = z.object({
    displayName: z.string(),
    slug: z.string(),
    bio: z.string(),
    links: z.array(z.string()).default([])
});
export const maskAddress = (address) => address
    .replace(/(\S+(?:시|도)\s+\S+(?:구|군|시)).*/, '$1 ****')
    .replace(/[0-9]{2,}/g, '**');
