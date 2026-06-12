import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OrderCard from '../../src/components/OrderCard';
import type { Order } from '../../src/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order1',
    ownerId: 'owner1',
    threadId: 'thread1',
    stage: 'confirmed',
    dueDate: null,
    dueTime: null,
    fulfillment: 'pickup',
    servings: 20,
    size: '6 inch',
    flavors: ['lemon'],
    dietary: [],
    designNotes: '',
    referenceImages: [],
    budget: null,
    quotedPrice: 85,
    depositStatus: 'none',
    calendarEventId: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('OrderCard', () => {
  it('renders customer name', () => {
    const { getByText } = render(
      <OrderCard order={makeOrder()} customerName="Maria Chen" onPress={jest.fn()} />
    );
    expect(getByText('Maria Chen')).toBeTruthy();
  });

  it('renders stage badge', () => {
    const { getByText } = render(
      <OrderCard order={makeOrder()} customerName="Maria" onPress={jest.fn()} />
    );
    expect(getByText('confirmed')).toBeTruthy();
  });

  it('renders quoted price', () => {
    const { getByText } = render(
      <OrderCard order={makeOrder({ quotedPrice: 85 })} customerName="Maria" onPress={jest.fn()} />
    );
    expect(getByText('$85.00')).toBeTruthy();
  });

  it('renders allergy warning when dietary restrictions exist', () => {
    const { getByText } = render(
      <OrderCard
        order={makeOrder({ dietary: ['nut-free', 'gluten-free'] })}
        customerName="Maria"
        onPress={jest.fn()}
      />
    );
    expect(getByText('nut-free, gluten-free')).toBeTruthy();
  });

  it('does not render allergy row when dietary is empty', () => {
    const { queryByText } = render(
      <OrderCard order={makeOrder({ dietary: [] })} customerName="Maria" onPress={jest.fn()} />
    );
    expect(queryByText('nut-free')).toBeNull();
  });

  it('shows "No date set" when dueDate is null', () => {
    const { getByText } = render(
      <OrderCard order={makeOrder({ dueDate: null })} customerName="Maria" onPress={jest.fn()} />
    );
    expect(getByText('No date set')).toBeTruthy();
  });

  it('renders formatted due date', () => {
    const { getByText } = render(
      <OrderCard order={makeOrder({ dueDate: '2024-08-15' })} customerName="Maria" onPress={jest.fn()} />
    );
    // Should render a human-readable date
    expect(getByText(/Aug/)).toBeTruthy();
  });

  it('shows lead time indicator when dueDate is set', () => {
    // A far future date should not be urgent
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split('T')[0];
    const { getByText } = render(
      <OrderCard order={makeOrder({ dueDate: dateStr })} customerName="Maria" onPress={jest.fn()} />
    );
    expect(getByText(/Due in \d+ days/)).toBeTruthy();
  });

  it('shows urgency for due-today orders', () => {
    const today = new Date().toISOString().split('T')[0];
    const { getByText } = render(
      <OrderCard order={makeOrder({ dueDate: today })} customerName="Maria" onPress={jest.fn()} />
    );
    expect(getByText('Due today')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <OrderCard order={makeOrder()} customerName="Maria" onPress={onPress} />
    );
    fireEvent.press(getByText('Maria'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders fulfillment type', () => {
    const { getByText } = render(
      <OrderCard order={makeOrder({ fulfillment: 'delivery' })} customerName="Maria" onPress={jest.fn()} />
    );
    expect(getByText('delivery')).toBeTruthy();
  });

  it('renders size chip', () => {
    const { getByText } = render(
      <OrderCard order={makeOrder({ size: '10 inch' })} customerName="Maria" onPress={jest.fn()} />
    );
    expect(getByText('10 inch')).toBeTruthy();
  });
});
