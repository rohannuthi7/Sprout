import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { IntakePayloadSchema } from '../types/schemas';
import {
  findThreadByChannelSender,
  createCustomer,
  createThread,
  addMessage,
  createOrUpdateOrder,
  logEditCorrection,
  updateThread,
  getThread,
  getOrderForThread,
  updateOrder,
} from '../utils/dynamodb';
import { buildThreadContext } from '../utils/context';
import { evaluateThread } from '../ai/pipeline';
import { verifyAuth, ok, apiError, corsOk, body, pathParam, ApiError } from '../utils/auth';
import type { Channel } from '../types';

// POST /intake/message
export async function intakeMessageHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const parsed = IntakePayloadSchema.safeParse(body(event));
    if (!parsed.success) throw new ApiError(400, parsed.error.message);

    const { rawText, channel, customerId, customerName, attachmentUrls = [] } = parsed.data;
    console.log('[Sprout] intakeMessage: channel=', channel, 'textLen=', rawText.length, 'hasCustomerId=', !!customerId);

    let resolvedCustomerId: string;
    let thread;

    if (customerId) {
      resolvedCustomerId = customerId;
      const channelSenderId = `${channel}:${customerId}`;
      const existing = await findThreadByChannelSender(ownerId, channel as Channel, channelSenderId);
      thread = existing ?? (await createThread(ownerId, resolvedCustomerId, channel as Channel, channelSenderId));
    } else {
      const name = customerName?.trim() || 'Unknown Customer';
      const channelSenderId = `${channel}:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const customer = await createCustomer(ownerId, name, channel as Channel, channelSenderId);
      resolvedCustomerId = customer.id;
      thread = await createThread(ownerId, customer.id, channel as Channel, channelSenderId);
    }

    await addMessage(ownerId, thread.id, 'inbound', channel as Channel, rawText, attachmentUrls);

    const ctx = await buildThreadContext(ownerId, thread.id);

    let evalResult = null;
    let parseError = false;

    try {
      console.log('[Sprout] intakeMessage: starting AI evaluation for thread', thread.id);
      evalResult = await evaluateThread(ctx);
      console.log('[Sprout] intakeMessage: AI evaluation complete, stage=', evalResult.stage);
    } catch (err) {
      console.error('[Sprout] intakeMessage: AI evaluation failed:', err);
      parseError = true;
    }

    if (evalResult) {
      const order = await createOrUpdateOrder(ownerId, thread.id, {
        ...evalResult.updatedOrderFields,
        stage: evalResult.stage,
      });

      await updateThread(thread.id, {
        status: 'needs_reply',
        rollingSummary: evalResult.rollingSummary,
        lastMessageFrom: 'customer',
      });

      return ok({ threadId: thread.id, orderId: order.id, evalResult, parseError: false });
    }

    await updateThread(thread.id, { status: 'needs_reply', lastMessageFrom: 'customer' });
    return ok({ threadId: thread.id, orderId: null, evalResult: null, parseError, rawMessage: rawText });
  } catch (err) {
    return apiError(err);
  }
}

// POST /intake/reply
export async function sendReplyHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const { threadId, replyText, originalDraft, advanceStage, newStage } = body<Record<string, unknown>>(event);

    if (!threadId || !replyText) throw new ApiError(400, 'threadId and replyText are required');

    const thread = await getThread(threadId as string);
    if (!thread) throw new ApiError(404, 'Thread not found');
    if (thread.ownerId !== ownerId) throw new ApiError(403, 'Access denied');

    await addMessage(ownerId, threadId as string, 'outbound', thread.channel as Channel, replyText as string);
    await logEditCorrection(ownerId, threadId as string, null, 'draft_reply', (originalDraft as string) ?? '', replyText as string);

    if (advanceStage && newStage) {
      const order = await getOrderForThread(threadId as string);
      if (order) {
        await updateOrder(order.id, { stage: newStage as import('../types').OrderStage });
      }
    }

    await updateThread(threadId as string, { status: 'waiting_on_customer', lastMessageFrom: 'owner' });
    return ok({ success: true });
  } catch (err) {
    return apiError(err);
  }
}
