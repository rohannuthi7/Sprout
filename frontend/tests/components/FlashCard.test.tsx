import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FlashCard from '../../src/components/FlashCard';
import type { FlashCardData } from '../../src/types';

function makeCardData(overrides: Partial<FlashCardData> = {}): FlashCardData {
  return {
    thread: {
      id: 'thread1',
      ownerId: 'owner1',
      customerId: 'cust1',
      channel: 'paste',
      channelSenderId: 'paste:cust1',
      status: 'needs_reply',
      rollingSummary: 'Customer wants a chocolate birthday cake',
      lastMessageAt: '2024-01-01T00:00:00.000Z',
      lastMessageFrom: 'customer',
    },
    customer: {
      id: 'cust1',
      ownerId: 'owner1',
      name: 'Jane Doe',
      contactHandles: [],
      notes: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    order: {
      id: 'order1',
      ownerId: 'owner1',
      threadId: 'thread1',
      stage: 'inquiry',
      dueDate: '2024-08-15',
      dueTime: null,
      fulfillment: 'pickup',
      servings: 30,
      size: '8 inch',
      flavors: ['chocolate', 'vanilla'],
      dietary: ['nut-free'],
      designNotes: 'Pink roses',
      referenceImages: [],
      budget: 150,
      quotedPrice: null,
      depositStatus: 'none',
      calendarEventId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    messages: [
      {
        id: 'msg1',
        ownerId: 'owner1',
        threadId: 'thread1',
        direction: 'inbound',
        channel: 'paste',
        rawText: 'Hi! I want a chocolate birthday cake for Aug 15th',
        attachments: [],
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    evalResult: {
      intent: 'inquiry',
      updatedOrderFields: {},
      stage: 'inquiry',
      draftReply: 'Hi Jane! Thank you for reaching out about a custom cake!',
      quote: null,
      needsAttention: false,
      missingInfo: ['delivery or pickup', 'design details'],
      safetyFlags: ['⚠️ Nut-free required'],
      rollingSummary: 'Customer wants a chocolate cake for Aug 15th, nut-free.',
    },
    ...overrides,
  };
}

function renderCard(props: Partial<Parameters<typeof FlashCard>[0]> = {}) {
  const defaults = {
    data: makeCardData(),
    isTop: true,
    onSwipeRight: jest.fn(),
    onSwipeLeft: jest.fn(),
    onSwipeUp: jest.fn(),
  };
  return render(
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FlashCard {...defaults} {...props} />
    </GestureHandlerRootView>
  );
}

describe('FlashCard', () => {
  it('renders customer name', () => {
    const { getByText } = renderCard();
    expect(getByText('Jane Doe')).toBeTruthy();
  });

  it('renders order stage badge', () => {
    const { getByText } = renderCard();
    expect(getByText('inquiry')).toBeTruthy();
  });

  it('renders safety flags prominently', () => {
    const { getByText } = renderCard();
    expect(getByText(/⚠️ Nut-free required/)).toBeTruthy();
  });

  it('renders the AI draft reply in the text input', () => {
    const { getByDisplayValue } = renderCard();
    expect(getByDisplayValue('Hi Jane! Thank you for reaching out about a custom cake!')).toBeTruthy();
  });

  it('renders missing info', () => {
    const { getByText } = renderCard();
    expect(getByText('• delivery or pickup')).toBeTruthy();
    expect(getByText('• design details')).toBeTruthy();
  });

  it('renders the inbound message', () => {
    const { getByText } = renderCard();
    expect(getByText('Hi! I want a chocolate birthday cake for Aug 15th')).toBeTruthy();
  });

  it('renders order details chips', () => {
    const { getByText } = renderCard();
    expect(getByText('2024-08-15')).toBeTruthy();
    expect(getByText('30 servings')).toBeTruthy();
    expect(getByText('8 inch')).toBeTruthy();
  });

  it('renders flavors', () => {
    const { getByText } = renderCard();
    expect(getByText('Flavors: chocolate, vanilla')).toBeTruthy();
  });

  it('renders dietary restriction warning', () => {
    const { getByText } = renderCard();
    expect(getByText('⚠️ Dietary: nut-free')).toBeTruthy();
  });

  it('shows "Confirm & Book" label for confirming stage', () => {
    const data = makeCardData();
    if (data.order) data.order.stage = 'confirming';
    // Label appears in both the swipe overlay and the action hints footer
    const { getAllByText } = renderCard({ data });
    expect(getAllByText('Confirm & Book').length).toBeGreaterThan(0);
  });

  it('shows "Send Quote" label for quoted stage', () => {
    const data = makeCardData();
    if (data.order) data.order.stage = 'quoted';
    const { getAllByText } = renderCard({ data });
    expect(getAllByText('Send Quote').length).toBeGreaterThan(0);
  });

  it('shows thread summary', () => {
    const { getByText } = renderCard();
    expect(getByText('Customer wants a chocolate birthday cake')).toBeTruthy();
  });

  it('does not show safety block when no safety flags', () => {
    const data = makeCardData();
    if (data.evalResult) data.evalResult.safetyFlags = [];
    const { queryByText } = renderCard({ data });
    expect(queryByText('Attention needed')).toBeNull();
  });

  it('does not show missing info section when empty', () => {
    const data = makeCardData();
    if (data.evalResult) data.evalResult.missingInfo = [];
    const { queryByText } = renderCard({ data });
    expect(queryByText('Still needed:')).toBeNull();
  });
});
