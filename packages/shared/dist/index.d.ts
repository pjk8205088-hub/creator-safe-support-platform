import { z } from 'zod';
export declare const Role: z.ZodEnum<["FAN", "CREATOR", "ADMIN"]>;
export type Role = z.infer<typeof Role>;
export declare const MoneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodLiteral<"KRW">;
}, "strip", z.ZodTypeAny, {
    amount: number;
    currency: "KRW";
}, {
    amount: number;
    currency: "KRW";
}>;
export declare const GiftStatus: z.ZodEnum<["PENDING_PAYMENT", "PAID", "ORDERED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]>;
export type GiftStatus = z.infer<typeof GiftStatus>;
export declare const CreateSupportSchema: z.ZodObject<{
    creatorId: z.ZodString;
    wishlistItemId: z.ZodOptional<z.ZodString>;
    supporterName: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    paymentProvider: z.ZodEnum<["TOSS", "KAKAO_PAY", "PORTONE", "MOCK"]>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    creatorId: string;
    supporterName: string;
    paymentProvider: "TOSS" | "KAKAO_PAY" | "PORTONE" | "MOCK";
    message?: string | undefined;
    wishlistItemId?: string | undefined;
}, {
    amount: number;
    creatorId: string;
    supporterName: string;
    paymentProvider: "TOSS" | "KAKAO_PAY" | "PORTONE" | "MOCK";
    message?: string | undefined;
    wishlistItemId?: string | undefined;
}>;
export type CreateSupportInput = z.infer<typeof CreateSupportSchema>;
export declare const CreatorProfileSchema: z.ZodObject<{
    displayName: z.ZodString;
    slug: z.ZodString;
    bio: z.ZodString;
    links: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    slug: string;
    bio: string;
    links: string[];
}, {
    displayName: string;
    slug: string;
    bio: string;
    links?: string[] | undefined;
}>;
export declare const maskAddress: (address: string) => string;
