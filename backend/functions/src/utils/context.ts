import type { Thread, Customer, Order, Message, PricingConfig, EditCorrectionLog, ThreadContext } from '../types';
import { rankCorrectionLogs } from '../ai/learning';
import {
  getThread,
  getOwnerProfile,
  getCustomer,
  getRecentMessages,
  getOrderForThread,
  getEditLogs,
  getPricingConfig,
} from './dynamodb';

const RECENT_MESSAGES_LIMIT = 10;
const CORRECTION_LOGS_FETCH_LIMIT = 30;

export async function buildThreadContext(ownerId: string, threadId: string): Promise<ThreadContext> {
  const [thread, ownerProfile] = await Promise.all([
    getThread(threadId),
    getOwnerProfile(ownerId),
  ]);

  if (!thread) throw new Error(`Thread ${threadId} not found`);

  const [customer, recentMessages, order, allLogs] = await Promise.all([
    getCustomer(thread.customerId),
    getRecentMessages(threadId, RECENT_MESSAGES_LIMIT),
    getOrderForThread(threadId),
    getEditLogs(ownerId, CORRECTION_LOGS_FETCH_LIMIT),
  ]);

  if (!customer) throw new Error(`Customer ${thread.customerId} not found`);

  const voiceProfile: string = (ownerProfile?.voiceProfile as string) ?? '';
  const pricingConfigId: string = (ownerProfile?.pricingConfigId as string) ?? '';

  let pricingConfig: PricingConfig | null = null;
  if (pricingConfigId) {
    const raw = await getPricingConfig(pricingConfigId);
    if (raw) pricingConfig = raw as unknown as PricingConfig;
  }

  const correctionExamples = rankCorrectionLogs(allLogs);

  return {
    thread: thread as Thread,
    customer: customer as Customer,
    order: order as Order | null,
    recentMessages: recentMessages as Message[],
    pricingConfig,
    voiceProfile,
    correctionExamples: correctionExamples as EditCorrectionLog[],
  };
}
