import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WebIntakeSchema } from '../types/schemas';
import { createCustomer, createThread, addMessage, createOrUpdateOrder, getDefaultOwnerId, updateThread } from '../utils/dynamodb';
import { buildThreadContext } from '../utils/context';
import { evaluateThread } from '../ai/pipeline';
import type { Channel } from '../types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// POST /web-intake  (public — no auth)
export async function webIntakeSubmitHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let reqBody: unknown;
  try {
    reqBody = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const parsed = WebIntakeSchema.safeParse(reqBody);
  if (!parsed.success) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: parsed.error.message }) };
  }

  const { message, customerName } = parsed.data;

  try {
    const ownerId = await getDefaultOwnerId();
    const name = customerName?.trim() || 'Web Visitor';
    const channelSenderId = `web_intake:${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const customer = await createCustomer(ownerId, name, 'web_intake' as Channel, channelSenderId);
    const thread = await createThread(ownerId, customer.id, 'web_intake' as Channel, channelSenderId);
    await addMessage(ownerId, thread.id, 'inbound', 'web_intake' as Channel, message);

    try {
      const ctx = await buildThreadContext(ownerId, thread.id);
      const evalResult = await evaluateThread(ctx);
      await createOrUpdateOrder(ownerId, thread.id, {
        ...evalResult.updatedOrderFields,
        stage: evalResult.stage,
      });
      await updateThread(thread.id, { rollingSummary: evalResult.rollingSummary });
    } catch (aiErr) {
      console.error('AI evaluation skipped for web intake:', aiErr);
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: "Your inquiry has been received! We'll be in touch soon." }),
    };
  } catch (err) {
    console.error('Web intake error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to submit inquiry. Please try again.' }),
    };
  }
}
