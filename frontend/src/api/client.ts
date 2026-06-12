import { getAccessToken } from '../hooks/useAuth';
import { API_BASE_URL } from '../lib/aws';
import type {
  IntakeResult,
  Thread,
  Order,
  Customer,
  Message,
  PricingConfig,
  OwnerProfile,
} from '../types';

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = await getAccessToken();
    headers['Authorization'] = token;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let message = text;
    try {
      message = JSON.parse(text)?.error ?? text;
    } catch { /* ignore */ }
    throw new Error(message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Intake ─────────────────────────────────────────────────────────────────

export async function callIntakeMessage(payload: {
  rawText: string;
  channel: string;
  customerId?: string;
  customerName?: string;
  attachmentUrls?: string[];
}): Promise<IntakeResult> {
  return apiFetch<IntakeResult>('/intake/message', { method: 'POST', body: JSON.stringify(payload) });
}

export async function callSendReply(payload: {
  threadId: string;
  replyText: string;
  originalDraft: string;
  advanceStage?: boolean;
  newStage?: string;
}): Promise<{ success: boolean }> {
  return apiFetch('/intake/reply', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Calendar & Booking ─────────────────────────────────────────────────────

export async function callConfirmAndBook(payload: {
  threadId: string;
  orderId: string;
  replyText: string;
  originalDraft: string;
}): Promise<{ success: boolean; calendarEventId: string | null; hasConflict: boolean; conflictCount: number }> {
  return apiFetch('/calendar/confirm', { method: 'POST', body: JSON.stringify(payload) });
}

export async function callDeclineOrder(payload: {
  threadId: string;
  orderId?: string;
  replyText: string;
}): Promise<{ success: boolean }> {
  return apiFetch('/calendar/decline', { method: 'POST', body: JSON.stringify(payload) });
}

export async function callGetCalendarAuthUrl(): Promise<{ url: string }> {
  return apiFetch('/calendar/auth-url', { method: 'GET' });
}

// ── Threads ────────────────────────────────────────────────────────────────

export async function callGetThreads(): Promise<{ threads: Thread[] }> {
  return apiFetch('/threads');
}

export async function callGetMessages(threadId: string, limit = 50): Promise<{ messages: Message[] }> {
  return apiFetch(`/threads/${encodeURIComponent(threadId)}/messages?limit=${limit}`);
}

export async function callParkThread(threadId: string): Promise<void> {
  await apiFetch(`/threads/${encodeURIComponent(threadId)}/park`, { method: 'POST', body: '{}' });
}

export async function callArchiveThread(threadId: string): Promise<void> {
  await apiFetch(`/threads/${encodeURIComponent(threadId)}/archive`, { method: 'POST', body: '{}' });
}

export async function callGetCustomers(): Promise<{ customers: Customer[] }> {
  return apiFetch('/customers');
}

// ── Orders ─────────────────────────────────────────────────────────────────

export async function callGetOrders(stage?: string): Promise<{ orders: Order[] }> {
  const qs = stage ? `?stage=${encodeURIComponent(stage)}` : '';
  return apiFetch(`/orders${qs}`);
}

export async function callGetOrder(orderId: string): Promise<{ order: Order }> {
  return apiFetch(`/orders/${encodeURIComponent(orderId)}`);
}

export async function callSavePricingConfig(config: {
  basePricesBySize: Record<string, number>;
  addOns: Array<{ name: string; price: number }>;
  rushFeeRules: Array<{ daysThreshold: number; feePercent: number }>;
  deliveryFee: number;
  depositPercent: number;
}): Promise<{ success: boolean; configId: string }> {
  return apiFetch('/orders/pricing', { method: 'POST', body: JSON.stringify(config) });
}

export async function callGetPricingConfig(): Promise<{ config: PricingConfig | null }> {
  return apiFetch('/orders/pricing');
}

export async function callGetOwnerProfile(): Promise<{ profile: OwnerProfile }> {
  return apiFetch('/profile');
}

export async function callUpdateOwnerProfile(data: {
  businessName?: string;
  voiceProfile?: string;
  weeklyCapacity?: number;
}): Promise<{ success: boolean }> {
  return apiFetch('/profile', { method: 'PUT', body: JSON.stringify(data) });
}

export async function callLogQuoteCorrection(payload: {
  threadId: string;
  orderId: string;
  originalQuote: number;
  correctedQuote: number;
}): Promise<{ success: boolean }> {
  return apiFetch(`/orders/${encodeURIComponent(payload.orderId)}/quote`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
