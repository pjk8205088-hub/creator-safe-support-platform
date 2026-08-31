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
export declare const DigitalOrderStatus: z.ZodEnum<["PENDING_PAYMENT", "PAID", "PROVISIONING", "ACTIVE", "CANCELLED", "REFUNDED"]>;
export type DigitalOrderStatus = z.infer<typeof DigitalOrderStatus>;
export declare const CreateDigitalOrderSchema: z.ZodObject<{
    creatorId: z.ZodString;
    wishlistItemId: z.ZodOptional<z.ZodString>;
    supporterName: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    paymentProvider: z.ZodEnum<["NICEPAY", "TOSS", "KAKAO_PAY", "PORTONE", "MOCK"]>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    creatorId: string;
    supporterName: string;
    paymentProvider: "NICEPAY" | "TOSS" | "KAKAO_PAY" | "PORTONE" | "MOCK";
    message?: string | undefined;
    wishlistItemId?: string | undefined;
}, {
    amount: number;
    creatorId: string;
    supporterName: string;
    paymentProvider: "NICEPAY" | "TOSS" | "KAKAO_PAY" | "PORTONE" | "MOCK";
    message?: string | undefined;
    wishlistItemId?: string | undefined;
}>;
export type CreateDigitalOrderInput = z.infer<typeof CreateDigitalOrderSchema>;
export declare const GiftStatus: z.ZodEnum<["PENDING_PAYMENT", "PAID", "PROVISIONING", "ACTIVE", "CANCELLED", "REFUNDED"]>;
export type GiftStatus = DigitalOrderStatus;
export declare const CreateSupportSchema: z.ZodObject<{
    creatorId: z.ZodString;
    wishlistItemId: z.ZodOptional<z.ZodString>;
    supporterName: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    paymentProvider: z.ZodEnum<["NICEPAY", "TOSS", "KAKAO_PAY", "PORTONE", "MOCK"]>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    creatorId: string;
    supporterName: string;
    paymentProvider: "NICEPAY" | "TOSS" | "KAKAO_PAY" | "PORTONE" | "MOCK";
    message?: string | undefined;
    wishlistItemId?: string | undefined;
}, {
    amount: number;
    creatorId: string;
    supporterName: string;
    paymentProvider: "NICEPAY" | "TOSS" | "KAKAO_PAY" | "PORTONE" | "MOCK";
    message?: string | undefined;
    wishlistItemId?: string | undefined;
}>;
export type CreateSupportInput = CreateDigitalOrderInput;
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
