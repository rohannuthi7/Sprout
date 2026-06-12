// Tests for the Firestore utility helpers — uses mocked firebase-admin.
// For rule-level security tests, use the Firebase Emulator with
// @firebase/rules-unit-testing (not covered here since emulator integration
// tests require a running emulator process).

jest.mock('firebase-admin', () => {
  const serverTimestamp = jest.fn(() => ({ _type: 'serverTimestamp' }));

  const mockDocRef = {
    id: 'mock-doc-id',
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
  };

  const mockCollectionRef = {
    doc: jest.fn(() => mockDocRef),
    add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  const firestoreFn = jest.fn(() => ({
    collection: jest.fn(() => mockCollectionRef),
  }));
  // admin.firestore.FieldValue is a static property on the firestore function
  (firestoreFn as unknown as Record<string, unknown>).FieldValue = { serverTimestamp };

  return {
    firestore: firestoreFn,
    initializeApp: jest.fn(),
    __mockDocRef: mockDocRef,
    __mockCollectionRef: mockCollectionRef,
  };
});

import * as admin from 'firebase-admin';

// Access the mock objects
const { __mockCollectionRef: collRef } = admin as unknown as {
  __mockCollectionRef: Record<string, jest.Mock>;
};

describe('findThreadByChannelSender', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when no thread matches', async () => {
    (collRef.get as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

    const { findThreadByChannelSender } = await import('../src/utils/firestore');
    const result = await findThreadByChannelSender('owner1', 'paste', 'paste:cust1');
    expect(result).toBeNull();
  });

  it('returns thread data when match found', async () => {
    const threadData = {
      ownerId: 'owner1',
      customerId: 'cust1',
      channel: 'paste',
      channelSenderId: 'paste:cust1',
      status: 'needs_reply',
    };
    (collRef.get as jest.Mock).mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'thread1', data: () => threadData }],
    });

    const { findThreadByChannelSender } = await import('../src/utils/firestore');
    const result = await findThreadByChannelSender('owner1', 'paste', 'paste:cust1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('thread1');
    expect(result?.channel).toBe('paste');
  });
});

describe('logEditCorrection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing when originalValue equals correctedValue', async () => {
    const { logEditCorrection } = await import('../src/utils/firestore');
    await logEditCorrection('owner1', 'thread1', 'order1', 'draft_reply', 'same text', 'same text');
    expect((collRef.add as jest.Mock)).not.toHaveBeenCalled();
  });

  it('writes a correction log when values differ', async () => {
    (collRef.add as jest.Mock).mockResolvedValueOnce({ id: 'log1' });

    const { logEditCorrection } = await import('../src/utils/firestore');
    await logEditCorrection('owner1', 'thread1', 'order1', 'draft_reply', 'original', 'corrected');

    expect(collRef.add).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'owner1',
        threadId: 'thread1',
        orderId: 'order1',
        fieldType: 'draft_reply',
        originalValue: 'original',
        correctedValue: 'corrected',
      })
    );
  });

  it('writes quote correction log', async () => {
    (collRef.add as jest.Mock).mockResolvedValueOnce({ id: 'log2' });

    const { logEditCorrection } = await import('../src/utils/firestore');
    await logEditCorrection('owner1', 'thread1', 'order1', 'quote', '200', '250');

    expect(collRef.add).toHaveBeenCalledWith(
      expect.objectContaining({ fieldType: 'quote', originalValue: '200', correctedValue: '250' })
    );
  });

  it('accepts null orderId', async () => {
    (collRef.add as jest.Mock).mockResolvedValueOnce({ id: 'log3' });

    const { logEditCorrection } = await import('../src/utils/firestore');
    await expect(
      logEditCorrection('owner1', 'thread1', null, 'draft_reply', 'a', 'b')
    ).resolves.not.toThrow();
  });
});

describe('getConfirmedOrdersOnDate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when no orders on that date', async () => {
    (collRef.get as jest.Mock).mockResolvedValueOnce({ docs: [] });

    const { getConfirmedOrdersOnDate } = await import('../src/utils/firestore');
    const result = await getConfirmedOrdersOnDate('owner1', '2024-08-15');
    expect(result).toEqual([]);
  });

  it('returns orders when found', async () => {
    const orderData = { ownerId: 'owner1', stage: 'confirmed', dueDate: '2024-08-15' };
    (collRef.get as jest.Mock).mockResolvedValueOnce({
      docs: [{ id: 'order1', data: () => orderData }],
    });

    const { getConfirmedOrdersOnDate } = await import('../src/utils/firestore');
    const result = await getConfirmedOrdersOnDate('owner1', '2024-08-15');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('order1');
  });
});
