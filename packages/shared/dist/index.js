import { z } from 'zod';
export const Role = z.enum(['FAN', 'CREATOR', 'ADMIN']);
export const MoneySchema = z.object({ amount: z.number().int().positive(), currency: z.literal('KRW') });
export const GiftStatus = z.enum(['PENDING_PAYMENT', 'PAID', 'ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']);
export const CreateSupportSchema = z.object({ creatorId: z.string().min(1), wishlistItemId: z.string().optional(), supporterName: z.string().min(1).max(30), message: z.string().max(500).optional(), amount: z.number().int().min(1000), paymentProvider: z.enum(['TOSS', 'KAKAO_PAY', 'PORTONE', 'MOCK']) });
export const CreatorProfileSchema = z.object({ displayName: z.string(), slug: z.string(), bio: z.string(), links: z.array(z.string()).default([]) });
export const maskAddress = (address) => address.replace(/(동|로|길).*/, '$1 ****').replace(/[0-9]{2,}/g, '**');
