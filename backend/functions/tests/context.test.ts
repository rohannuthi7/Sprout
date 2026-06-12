// Tests for buildThreadContext utility — Firestore admin SDK is mocked

const mockGet = jest.fn();
const mockRef = {
  update: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
};

// Chain mock: every collection/doc/where/orderBy/limit call returns the same mock object
const firestoreMock = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: mockGet,
  add: jest.fn().mockResolvedValue({ id: 'new_id' }),
};

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => firestoreMock),
  initializeApp: jest.fn(),
}));

// Also mock the learning module to isolate context building
jest.mock('../src/ai/learning', () => ({
  rankCorrectionLogs: jest.fn((logs: unknown[]) => logs.slice(0, 5)),
}));

// Helpers
function makeDoc(id: string, data: Record<string, unknown>) {
  return { id, exists: true, data: () => data, ref: mockRef };
}
function makeEmptySnap() {
  return { empty: true, docs: [] };
}
function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    empty: docs.length === 0,
    docs: docs.map(d => makeDoc(d.id, d.data)),
  };
}

const baseThread = {
  ownerId: 'owner1',
  customerId: 'cust1',
  channel: 'paste',
  channelSenderId: 'paste:cust1',
  status: 'needs_reply',
  rollingSummary: 'Wants a birthday cake',
  lastMessageAt: {},
  lastMessageFrom: 'customer',
};

const baseCustomer = {
  ownerId: 'owner1',
  name: 'Jane Doe',
  contactHandles: [],
  notes: '',
  createdAt: {},
};

describe('buildThreadContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if thread does not exist', async () => {
    // First get: thread not found
    mockGet
      .mockResolvedValueOnce({ exists: false }) // thread
      .mockResolvedValueOnce({ exists: false, data: () => null }); // ownerProfile (batched)

    const { buildThreadContext } = await import('../src/utils/context');
    await expect(buildThreadContext('owner1', 'bad_thread')).rejects.toThrow('not found');
  });

  it('throws if customer does not exist', async () => {
    mockGet
      .mockResolvedValueOnce(makeDoc('thread1', baseThread)) // thread (parallel batch)
      .mockResolvedValueOnce({ exists: false, data: () => null }) // ownerProfile (parallel batch)
      .mockResolvedValueOnce({ exists: false }); // customer

    const { buildThreadContext } = await import('../src/utils/context');
    await expect(buildThreadContext('owner1', 'thread1')).rejects.toThrow('not found');
  });

  it('returns null order when no order exists for thread', async () => {
    mockGet
      .mockResolvedValueOnce(makeDoc('thread1', baseThread)) // thread
      .mockResolvedValueOnce({ exists: true, data: () => ({ voiceProfile: 'warm', pricingConfigId: '' }) }) // ownerProfile
      .mockResolvedValueOnce(makeDoc('cust1', baseCustomer)) // customer
      .mockResolvedValueOnce(makeSnap([{ id: 'msg1', data: { threadId: 'thread1', direction: 'inbound', rawText: 'hello', createdAt: {} } }])) // messages
      .mockResolvedValueOnce(makeEmptySnap()) // orders (none)
      .mockResolvedValueOnce(makeEmptySnap()); // editLogs

    const { buildThreadContext } = await import('../src/utils/context');
    const ctx = await buildThreadContext('owner1', 'thread1');

    expect(ctx.order).toBeNull();
    expect(ctx.customer.name).toBe('Jane Doe');
    expect(ctx.recentMessages).toHaveLength(1);
  });

  it('returns order when one exists', async () => {
    const orderData = {
      ownerId: 'owner1',
      threadId: 'thread1',
      stage: 'inquiry',
      dueDate: '2024-07-04',
      dietary: ['nut-free'],
      flavors: ['chocolate'],
      servings: 30,
    };

    mockGet
      .mockResolvedValueOnce(makeDoc('thread1', baseThread))
      .mockResolvedValueOnce({ exists: true, data: () => ({ voiceProfile: '', pricingConfigId: '' }) })
      .mockResolvedValueOnce(makeDoc('cust1', baseCustomer))
      .mockResolvedValueOnce(makeSnap([]))
      .mockResolvedValueOnce(makeSnap([{ id: 'order1', data: orderData }]))
      .mockResolvedValueOnce(makeEmptySnap());

    const { buildThreadContext } = await import('../src/utils/context');
    const ctx = await buildThreadContext('owner1', 'thread1');

    expect(ctx.order).not.toBeNull();
    expect(ctx.order?.stage).toBe('inquiry');
    expect(ctx.order?.dietary).toEqual(['nut-free']);
  });

  it('returns messages in chronological order', async () => {
    const msgs = [
      { id: 'msg3', data: { threadId: 't1', direction: 'outbound', rawText: 'reply', createdAt: {} } },
      { id: 'msg2', data: { threadId: 't1', direction: 'inbound', rawText: 'question', createdAt: {} } },
      { id: 'msg1', data: { threadId: 't1', direction: 'inbound', rawText: 'hello', createdAt: {} } },
    ];

    mockGet
      .mockResolvedValueOnce(makeDoc('t1', baseThread))
      .mockResolvedValueOnce({ exists: true, data: () => ({ voiceProfile: '', pricingConfigId: '' }) })
      .mockResolvedValueOnce(makeDoc('cust1', baseCustomer))
      .mockResolvedValueOnce(makeSnap(msgs)) // newest-first from query
      .mockResolvedValueOnce(makeEmptySnap())
      .mockResolvedValueOnce(makeEmptySnap());

    const { buildThreadContext } = await import('../src/utils/context');
    const ctx = await buildThreadContext('owner1', 't1');

    // Should be reversed to chronological order
    expect(ctx.recentMessages[0].rawText).toBe('hello');
    expect(ctx.recentMessages[2].rawText).toBe('reply');
  });

  it('includes pricing config when configured', async () => {
    const pricingData = {
      ownerId: 'owner1',
      basePricesBySize: { '6 inch': 45 },
      addOns: [],
      rushFeeRules: [],
      deliveryFee: 10,
      depositPercent: 50,
    };

    mockGet
      .mockResolvedValueOnce(makeDoc('thread1', baseThread))
      .mockResolvedValueOnce({ exists: true, data: () => ({ voiceProfile: 'warm', pricingConfigId: 'config1' }) })
      .mockResolvedValueOnce(makeDoc('cust1', baseCustomer))
      .mockResolvedValueOnce(makeSnap([]))
      .mockResolvedValueOnce(makeEmptySnap())
      .mockResolvedValueOnce(makeEmptySnap()) // editLogs
      .mockResolvedValueOnce(makeDoc('config1', pricingData)); // pricing config

    const { buildThreadContext } = await import('../src/utils/context');
    const ctx = await buildThreadContext('owner1', 'thread1');

    expect(ctx.pricingConfig).not.toBeNull();
    expect(ctx.pricingConfig?.deliveryFee).toBe(10);
    expect(ctx.voiceProfile).toBe('warm');
  });
});
