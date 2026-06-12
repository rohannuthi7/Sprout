import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import InboxScreen from '../../src/screens/InboxScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock hooks
jest.mock('../../src/hooks/useThreads', () => ({
  useThreads: jest.fn(() => ({
    threads: [],
    needsReply: [],
    parked: [],
    waitingOnCustomer: [],
    loading: false,
    error: null,
  })),
}));

// Mock API client
jest.mock('../../src/api/client', () => ({
  callIntakeMessage: jest.fn().mockResolvedValue({
    threadId: 'new-thread-id',
    orderId: 'new-order-id',
    evalResult: { intent: 'inquiry', draftReply: 'Hi!', safetyFlags: [], missingInfo: [], stage: 'inquiry' },
    parseError: false,
  }),
  callGetCustomers: jest.fn().mockResolvedValue({ customers: [] }),
}));

import { useThreads } from '../../src/hooks/useThreads';
import { callIntakeMessage } from '../../src/api/client';

function renderScreen() {
  return render(
    <NavigationContainer>
      <InboxScreen />
    </NavigationContainer>
  );
}

describe('InboxScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Sprout wordmark', () => {
    const { getByText } = renderScreen();
    expect(getByText('🌱 Sprout')).toBeTruthy();
  });

  it('renders "Paste message" button', () => {
    const { getByText } = renderScreen();
    expect(getByText('Paste message')).toBeTruthy();
  });

  it('shows empty state when no threads', () => {
    const { getByText } = renderScreen();
    expect(getByText('All caught up!')).toBeTruthy();
  });

  it('shows flashcard banner when there are threads needing reply', () => {
    (useThreads as jest.Mock).mockReturnValueOnce({
      threads: [],
      needsReply: [
        { id: 't1', customerId: 'c1', status: 'needs_reply', rollingSummary: 'Cake inquiry', channel: 'paste', lastMessageAt: null, lastMessageFrom: 'customer' },
        { id: 't2', customerId: 'c2', status: 'needs_reply', rollingSummary: 'Another inquiry', channel: 'web_intake', lastMessageAt: null, lastMessageFrom: 'customer' },
      ],
      parked: [],
      waitingOnCustomer: [],
      loading: false,
      error: null,
    });

    const { getByText } = renderScreen();
    expect(getByText('2 messages waiting')).toBeTruthy();
    expect(getByText('Tap to review & respond')).toBeTruthy();
  });

  it('shows singular "message" for 1 unread thread', () => {
    (useThreads as jest.Mock).mockReturnValueOnce({
      threads: [],
      needsReply: [
        { id: 't1', customerId: 'c1', status: 'needs_reply', rollingSummary: 'Inquiry', channel: 'paste', lastMessageAt: null, lastMessageFrom: 'customer' },
      ],
      parked: [],
      waitingOnCustomer: [],
      loading: false,
      error: null,
    });

    const { getByText } = renderScreen();
    expect(getByText('1 message waiting')).toBeTruthy();
  });

  it('shows "Needs Reply" section header when threads exist', () => {
    (useThreads as jest.Mock).mockReturnValueOnce({
      threads: [],
      needsReply: [
        { id: 't1', customerId: 'c1', status: 'needs_reply', rollingSummary: 'Test', channel: 'paste', lastMessageAt: null, lastMessageFrom: 'customer' },
      ],
      parked: [],
      waitingOnCustomer: [],
      loading: false,
      error: null,
    });

    const { getByText } = renderScreen();
    expect(getByText('Needs Reply')).toBeTruthy();
  });

  it('opens paste modal when paste button is pressed', () => {
    const { getByText, queryByText } = renderScreen();
    expect(queryByText('Paste Customer Message')).toBeNull();

    fireEvent.press(getByText('Paste message'));
    expect(getByText('Paste Customer Message')).toBeTruthy();
  });

  it('shows "Parked" section when parked threads exist', () => {
    (useThreads as jest.Mock).mockReturnValueOnce({
      threads: [],
      needsReply: [],
      parked: [
        { id: 't1', customerId: 'c1', status: 'parked', rollingSummary: 'Parked inquiry', channel: 'paste', lastMessageAt: null, lastMessageFrom: 'customer' },
      ],
      waitingOnCustomer: [],
      loading: false,
      error: null,
    });

    const { getByText } = renderScreen();
    expect(getByText('Parked')).toBeTruthy();
  });

  it('shows "Waiting on Customer" section when applicable', () => {
    (useThreads as jest.Mock).mockReturnValueOnce({
      threads: [],
      needsReply: [],
      parked: [],
      waitingOnCustomer: [
        { id: 't1', customerId: 'c1', status: 'waiting_on_customer', rollingSummary: 'Sent quote', channel: 'paste', lastMessageAt: null, lastMessageFrom: 'owner' },
      ],
      loading: false,
      error: null,
    });

    const { getByText } = renderScreen();
    expect(getByText('Waiting on Customer (1)')).toBeTruthy();
  });
});
