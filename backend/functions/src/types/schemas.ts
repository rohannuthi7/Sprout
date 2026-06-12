import { z } from 'zod';

export const MessageIntentSchema = z.enum([
  'inquiry',
  'question',
  'providing_details',
  'confirming',
  'changing',
  'cancelling',
  'other',
]);

export const OrderStageSchema = z.enum([
  'inquiry',
  'quoted',
  'confirming',
  'confirmed',
  'completed',
  'declined',
  'archived',
]);

export const FulfillmentSchema = z.enum(['pickup', 'delivery']);

export const UpdatedOrderFieldsSchema = z.object({
  stage: OrderStageSchema.optional(),
  dueDate: z.string().nullable().optional(),
  dueTime: z.string().nullable().optional(),
  fulfillment: FulfillmentSchema.nullable().optional(),
  servings: z.number().int().positive().nullable().optional(),
  size: z.string().nullable().optional(),
  flavors: z.array(z.string()).optional(),
  dietary: z.array(z.string()).optional(),
  designNotes: z.string().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  quotedPrice: z.number().nonnegative().nullable().optional(),
});

export const AIEvalResultSchema = z.object({
  intent: MessageIntentSchema,
  updatedOrderFields: UpdatedOrderFieldsSchema,
  stage: OrderStageSchema,
  draftReply: z.string().min(1, 'Draft reply cannot be empty'),
  quote: z.number().nonnegative().nullable(),
  needsAttention: z.boolean(),
  missingInfo: z.array(z.string()),
  safetyFlags: z.array(z.string()),
  rollingSummary: z.string(),
});

export type ValidatedAIEvalResult = z.infer<typeof AIEvalResultSchema>;

export const WebIntakeSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
  customerName: z.string().max(200).optional(),
});

export const IntakePayloadSchema = z.object({
  rawText: z.string().min(1).max(10000),
  channel: z.enum(['paste', 'web_intake', 'sms', 'email', 'instagram']),
  customerId: z.string().optional(),
  customerName: z.string().max(200).optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
});

export const SendReplySchema = z.object({
  threadId: z.string().min(1),
  replyText: z.string().min(1).max(5000),
  originalDraft: z.string(),
  advanceStage: z.boolean().default(false),
  newStage: OrderStageSchema.optional(),
});

export const ConfirmAndBookSchema = z.object({
  threadId: z.string().min(1),
  orderId: z.string().min(1),
  replyText: z.string().min(1).max(5000),
  originalDraft: z.string(),
});

export const DeclineActionSchema = z.object({
  threadId: z.string().min(1),
  orderId: z.string().min(1),
  replyText: z.string().min(1).max(5000),
});

export const AddOnSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
});

export const RushFeeRuleSchema = z.object({
  daysThreshold: z.number().int().min(1),
  feePercent: z.number().min(0).max(100),
});

export const PricingConfigSchema = z.object({
  basePricesBySize: z.record(z.string(), z.number().min(0)),
  addOns: z.array(AddOnSchema),
  rushFeeRules: z.array(RushFeeRuleSchema),
  deliveryFee: z.number().min(0),
  depositPercent: z.number().min(0).max(100),
});

export const OwnerProfileUpdateSchema = z.object({
  businessName: z.string().max(200).optional(),
  voiceProfile: z.string().max(2000).optional(),
  weeklyCapacity: z.number().int().min(1).max(100).optional(),
});
