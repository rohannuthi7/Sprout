import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  getThreadsByOwner,
  getThread,
  getMessages,
  getCustomersByOwner,
  updateThread,
} from '../utils/dynamodb';
import { verifyAuth, ok, apiError, corsOk, ApiError } from '../utils/auth';

// GET /threads
export async function getThreadsHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const threads = await getThreadsByOwner(ownerId);
    return ok({ threads });
  } catch (err) {
    return apiError(err);
  }
}

// GET /threads/{threadId}/messages
export async function getMessagesHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const threadId = event.pathParameters?.threadId;
    if (!threadId) throw new ApiError(400, 'threadId is required');

    const thread = await getThread(threadId);
    if (!thread) throw new ApiError(404, 'Thread not found');
    if (thread.ownerId !== ownerId) throw new ApiError(403, 'Access denied');

    const limitStr = event.queryStringParameters?.limit ?? '50';
    const limit = Math.min(parseInt(limitStr, 10) || 50, 200);

    const messages = await getMessages(threadId, limit);
    return ok({ messages });
  } catch (err) {
    return apiError(err);
  }
}

// POST /threads/{threadId}/park
export async function parkThreadHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const threadId = event.pathParameters?.threadId;
    if (!threadId) throw new ApiError(400, 'threadId is required');

    const thread = await getThread(threadId);
    if (!thread) throw new ApiError(404, 'Thread not found');
    if (thread.ownerId !== ownerId) throw new ApiError(403, 'Access denied');

    await updateThread(threadId, { status: 'parked' });
    return ok({ success: true });
  } catch (err) {
    return apiError(err);
  }
}

// POST /threads/{threadId}/archive
export async function archiveThreadHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const threadId = event.pathParameters?.threadId;
    if (!threadId) throw new ApiError(400, 'threadId is required');

    const thread = await getThread(threadId);
    if (!thread) throw new ApiError(404, 'Thread not found');
    if (thread.ownerId !== ownerId) throw new ApiError(403, 'Access denied');

    await updateThread(threadId, { status: 'archived' });
    return ok({ success: true });
  } catch (err) {
    return apiError(err);
  }
}

// GET /customers
export async function getCustomersHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const customers = await getCustomersByOwner(ownerId);
    return ok({ customers });
  } catch (err) {
    return apiError(err);
  }
}
