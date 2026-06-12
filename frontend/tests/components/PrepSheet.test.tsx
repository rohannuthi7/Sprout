import React from 'react';
import { render } from '@testing-library/react-native';
import PrepSheet from '../../src/components/PrepSheet';
import type { Order } from '../../src/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order1',
    ownerId: 'owner1',
    threadId: 'thread1',
    stage: 'confirmed',
    dueDate: '2024-09-14',
    dueTime: '14:00',
    fulfillment: 'pickup',
    servings: 80,
    size: '3-tier',
    flavors: ['vanilla', 'chocolate', 'lemon'],
    dietary: [],
    designNotes: 'Ivory with cascading florals',
    referenceImages: [],
    budget: null,
    quotedPrice: 650,
    depositStatus: 'paid',
    calendarEventId: 'cal_event_1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('PrepSheet', () => {
  it('renders "Prep Sheet" title', () => {
    const { getByText } = render(<PrepSheet order={makeOrder()} customerName="Wedding Client" />);
    expect(getByText('Prep Sheet')).toBeTruthy();
  });

  it('renders customer name as subtitle', () => {
    const { getByText } = render(<PrepSheet order={makeOrder()} customerName="Wedding Client" />);
    expect(getByText('Wedding Client')).toBeTruthy();
  });

  // ALLERGY TESTS — these are safety-critical
  it('renders allergy block when dietary restrictions exist', () => {
    const { getByText } = render(
      <PrepSheet order={makeOrder({ dietary: ['peanut allergy', 'gluten-free'] })} customerName="Client" />
    );
    expect(getByText(/DIETARY \/ ALLERGIES/i)).toBeTruthy();
    expect(getByText('• peanut allergy')).toBeTruthy();
    expect(getByText('• gluten-free')).toBeTruthy();
  });

  it('renders each allergy as a separate line item', () => {
    const allergies = ['nut-free', 'dairy-free', 'egg-free'];
    const { getByText } = render(
      <PrepSheet order={makeOrder({ dietary: allergies })} customerName="Client" />
    );
    allergies.forEach(a => expect(getByText(`• ${a}`)).toBeTruthy());
  });

  it('does NOT render allergy block when dietary is empty', () => {
    const { queryByText } = render(
      <PrepSheet order={makeOrder({ dietary: [] })} customerName="Client" />
    );
    expect(queryByText(/DIETARY \/ ALLERGIES/i)).toBeNull();
  });

  it('renders due date in human-readable format', () => {
    const { getByText } = render(<PrepSheet order={makeOrder()} customerName="Client" />);
    // 2024-09-14 should render as something like "Saturday, September 14, 2024"
    expect(getByText(/September 14, 2024/)).toBeTruthy();
  });

  it('renders "TBD" when due date is null', () => {
    const { getAllByText } = render(
      <PrepSheet order={makeOrder({ dueDate: null })} customerName="Client" />
    );
    expect(getAllByText('TBD').length).toBeGreaterThan(0);
  });

  it('renders due time when present', () => {
    const { getByText } = render(<PrepSheet order={makeOrder({ dueTime: '14:00' })} customerName="Client" />);
    expect(getByText('14:00')).toBeTruthy();
  });

  it('renders fulfillment type', () => {
    const { getByText } = render(<PrepSheet order={makeOrder({ fulfillment: 'delivery' })} customerName="Client" />);
    expect(getByText('delivery')).toBeTruthy();
  });

  it('renders servings count', () => {
    const { getByText } = render(<PrepSheet order={makeOrder({ servings: 80 })} customerName="Client" />);
    expect(getByText('80')).toBeTruthy();
  });

  it('renders cake size', () => {
    const { getByText } = render(<PrepSheet order={makeOrder({ size: '3-tier' })} customerName="Client" />);
    expect(getByText('3-tier')).toBeTruthy();
  });

  it('renders all flavors as list items', () => {
    const { getByText } = render(<PrepSheet order={makeOrder()} customerName="Client" />);
    expect(getByText('• vanilla')).toBeTruthy();
    expect(getByText('• chocolate')).toBeTruthy();
    expect(getByText('• lemon')).toBeTruthy();
  });

  it('does not render flavors section when empty', () => {
    const { queryByText } = render(
      <PrepSheet order={makeOrder({ flavors: [] })} customerName="Client" />
    );
    expect(queryByText('• vanilla')).toBeNull();
  });

  it('renders design notes', () => {
    const { getByText } = render(<PrepSheet order={makeOrder()} customerName="Client" />);
    expect(getByText('Ivory with cascading florals')).toBeTruthy();
  });

  it('renders quoted price', () => {
    const { getByText } = render(<PrepSheet order={makeOrder({ quotedPrice: 650 })} customerName="Client" />);
    expect(getByText('$650.00')).toBeTruthy();
  });

  it('renders deposit paid status', () => {
    const { getByText } = render(
      <PrepSheet order={makeOrder({ depositStatus: 'paid' })} customerName="Client" />
    );
    expect(getByText('Paid ✓')).toBeTruthy();
  });

  it('renders deposit not requested status', () => {
    const { getByText } = render(
      <PrepSheet order={makeOrder({ depositStatus: 'none' })} customerName="Client" />
    );
    expect(getByText('Not requested')).toBeTruthy();
  });
});
