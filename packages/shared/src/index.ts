import { z } from 'zod';

export const Role = z.enum(['FAN', 'CREATOR', 'ADMIN']);
export type Role = z.infer<typeof Role>;

export const MoneySchema = z.object({
  amount: z.number().int().positive(),
  currency: z.literal('KRW')
});

export const DigitalOrderStatus = z.enum(['PENDING_PAYMENT', 'PAID', 'PROVISIONING', 'ACTIVE', 'CANCELLED', 'REFUNDED']);
export type DigitalOrderStatus = z.infer<typeof DigitalOrderStatus>;

export const CreateDigitalOrderSchema = z.object({
  creatorId: z.string().min(1),
  wishlistItemId: z.string().optional(),
  supporterName: z.string().min(1).max(30),
  message: z.string().max(500).optional(),
  amount: z.number().int().min(1000),
  paymentProvider: z.enum(['NICEPAY', 'TOSS', 'KAKAO_PAY', 'PORTONE', 'MOCK'])
});
export type CreateDigitalOrderInput = z.infer<typeof CreateDigitalOrderSchema>;

// Backward-compatible aliases for the existing API route while the database migration is staged.
export const GiftStatus = DigitalOrderStatus;
export type GiftStatus = DigitalOrderStatus;
export const CreateSupportSchema = CreateDigitalOrderSchema;
export type CreateSupportInput = CreateDigitalOrderInput;

export const CreatorProfileSchema = z.object({
  displayName: z.string(),
  slug: z.string(),
  bio: z.string(),
  links: z.array(z.string()).default([])
});

export const maskAddress = (address: string) =>
  address
    .replace(/(\S+(?:시|도)\s+\S+(?:구|군|시)).*/, '$1 ****')
    .replace(/[0-9]{2,}/g, '**');
