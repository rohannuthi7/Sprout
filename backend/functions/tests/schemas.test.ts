import {
  AIEvalResultSchema,
  WebIntakeSchema,
  IntakePayloadSchema,
  PricingConfigSchema,
  SendReplySchema,
} from '../src/types/schemas';

const validEvalResult = {
  intent: 'inquiry',
  updatedOrderFields: {
    stage: 'inquiry',
    dueDate: '2024-06-15',
    dueTime: '14:00',
    fulfillment: 'pickup',
    servings: 30,
    size: '8 inch',
    flavors: ['vanilla', 'strawberry'],
    dietary: ['nut-free'],
    designNotes: 'floral design with pink roses',
    budget: 200,
    quotedPrice: null,
  },
  stage: 'inquiry',
  draftReply: 'Hi! Thank you so much for reaching out. I would love to help you with a custom cake!',
  quote: null,
  needsAttention: false,
  missingInfo: ['pickup time', 'number of tiers'],
  safetyFlags: ['⚠️ Nut allergy noted'],
  rollingSummary: 'Customer wants an 8-inch vanilla/strawberry cake for June 15, pickup, nut-free.',
};

describe('AIEvalResultSchema', () => {
  it('accepts a fully valid result', () => {
    expect(AIEvalResultSchema.safeParse(validEvalResult).success).toBe(true);
  });

  it('rejects missing draftReply', () => {
    const { draftReply: _omit, ...rest } = validEvalResult;
    expect(AIEvalResultSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects empty draftReply', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, draftReply: '' }).success).toBe(false);
  });

  it('rejects invalid intent', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, intent: 'spam' }).success).toBe(false);
  });

  it('accepts all valid intents', () => {
    const intents = ['inquiry', 'question', 'providing_details', 'confirming', 'changing', 'cancelling', 'other'];
    for (const intent of intents) {
      expect(AIEvalResultSchema.safeParse({ ...validEvalResult, intent }).success).toBe(true);
    }
  });

  it('rejects invalid stage', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, stage: 'pending' }).success).toBe(false);
  });

  it('accepts all valid stages', () => {
    const stages = ['inquiry', 'quoted', 'confirming', 'confirmed', 'completed', 'declined', 'archived'];
    for (const stage of stages) {
      expect(AIEvalResultSchema.safeParse({ ...validEvalResult, stage }).success).toBe(true);
    }
  });

  it('accepts null quote', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, quote: null }).success).toBe(true);
  });

  it('accepts numeric quote', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, quote: 285.50 }).success).toBe(true);
  });

  it('rejects negative quote', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, quote: -10 }).success).toBe(false);
  });

  it('accepts empty missingInfo array', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, missingInfo: [] }).success).toBe(true);
  });

  it('accepts empty safetyFlags array', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, safetyFlags: [] }).success).toBe(true);
  });

  it('accepts empty updatedOrderFields', () => {
    expect(AIEvalResultSchema.safeParse({ ...validEvalResult, updatedOrderFields: {} }).success).toBe(true);
  });

  it('accepts null date fields in updatedOrderFields', () => {
    const fields = { ...validEvalResult, updatedOrderFields: { dueDate: null, dueTime: null } };
    expect(AIEvalResultSchema.safeParse(fields).success).toBe(true);
  });

  it('rejects negative servings', () => {
    const fields = { ...validEvalResult, updatedOrderFields: { servings: -1 } };
    expect(AIEvalResultSchema.safeParse(fields).success).toBe(false);
  });
});

describe('WebIntakeSchema', () => {
  it('accepts valid submission with name', () => {
    expect(WebIntakeSchema.safeParse({ message: 'I want a birthday cake!', customerName: 'Jane' }).success).toBe(true);
  });

  it('accepts valid submission without name', () => {
    expect(WebIntakeSchema.safeParse({ message: 'I want a birthday cake!' }).success).toBe(true);
  });

  it('rejects empty message', () => {
    expect(WebIntakeSchema.safeParse({ message: '' }).success).toBe(false);
  });

  it('rejects message over 5000 chars', () => {
    expect(WebIntakeSchema.safeParse({ message: 'x'.repeat(5001) }).success).toBe(false);
  });

  it('accepts exactly 5000 char message', () => {
    expect(WebIntakeSchema.safeParse({ message: 'x'.repeat(5000) }).success).toBe(true);
  });

  it('rejects customerName over 200 chars', () => {
    expect(WebIntakeSchema.safeParse({ message: 'hi', customerName: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('IntakePayloadSchema', () => {
  it('accepts valid paste intake with new customer', () => {
    const result = IntakePayloadSchema.safeParse({
      rawText: 'Hi, I need a custom cake for my daughter\'s birthday on July 4th. She has a severe peanut allergy.',
      channel: 'paste',
      customerName: 'Sarah Johnson',
    });
    expect(result.success).toBe(true);
  });

  it('accepts paste with existing customerId', () => {
    expect(IntakePayloadSchema.safeParse({
      rawText: 'Follow up question',
      channel: 'paste',
      customerId: 'cust_123',
    }).success).toBe(true);
  });

  it('accepts all valid channels', () => {
    for (const channel of ['paste', 'web_intake', 'sms', 'email', 'instagram']) {
      expect(IntakePayloadSchema.safeParse({ rawText: 'test', channel }).success).toBe(true);
    }
  });

  it('rejects invalid channel', () => {
    expect(IntakePayloadSchema.safeParse({ rawText: 'test', channel: 'tiktok' }).success).toBe(false);
  });

  it('rejects empty rawText', () => {
    expect(IntakePayloadSchema.safeParse({ rawText: '', channel: 'paste' }).success).toBe(false);
  });

  it('rejects rawText over 10000 chars', () => {
    expect(IntakePayloadSchema.safeParse({ rawText: 'x'.repeat(10001), channel: 'paste' }).success).toBe(false);
  });

  it('accepts valid attachment URLs', () => {
    expect(IntakePayloadSchema.safeParse({
      rawText: 'Reference photo:',
      channel: 'paste',
      attachmentUrls: ['https://example.com/cake-inspo.jpg'],
    }).success).toBe(true);
  });

  it('rejects non-URL attachment values', () => {
    expect(IntakePayloadSchema.safeParse({
      rawText: 'Reference photo:',
      channel: 'paste',
      attachmentUrls: ['not-a-valid-url'],
    }).success).toBe(false);
  });
});

describe('PricingConfigSchema', () => {
  const validConfig = {
    basePricesBySize: { '6 inch': 45, '8 inch': 65, '10 inch': 85, 'quarter sheet': 90 },
    addOns: [
      { name: 'Extra tier', price: 25 },
      { name: 'Custom figurine', price: 15 },
    ],
    rushFeeRules: [{ daysThreshold: 3, feePercent: 20 }],
    deliveryFee: 15,
    depositPercent: 50,
  };

  it('accepts a valid pricing config', () => {
    expect(PricingConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('rejects negative base price', () => {
    expect(PricingConfigSchema.safeParse({
      ...validConfig,
      basePricesBySize: { '6 inch': -5 },
    }).success).toBe(false);
  });

  it('rejects deposit percent over 100', () => {
    expect(PricingConfigSchema.safeParse({ ...validConfig, depositPercent: 101 }).success).toBe(false);
  });

  it('accepts zero delivery fee', () => {
    expect(PricingConfigSchema.safeParse({ ...validConfig, deliveryFee: 0 }).success).toBe(true);
  });
});

describe('SendReplySchema', () => {
  it('accepts valid reply with stage advance', () => {
    expect(SendReplySchema.safeParse({
      threadId: 'thread_123',
      replyText: 'Hi! Here is your quote...',
      originalDraft: 'Here is your quote',
      advanceStage: true,
      newStage: 'quoted',
    }).success).toBe(true);
  });

  it('accepts reply without stage advance', () => {
    expect(SendReplySchema.safeParse({
      threadId: 'thread_123',
      replyText: 'Thanks for your message!',
      originalDraft: 'Thanks for your message!',
      advanceStage: false,
    }).success).toBe(true);
  });

  it('rejects empty replyText', () => {
    expect(SendReplySchema.safeParse({
      threadId: 'thread_123',
      replyText: '',
      originalDraft: '',
      advanceStage: false,
    }).success).toBe(false);
  });
});
