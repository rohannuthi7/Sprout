import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { google } from 'googleapis';
import type { Order } from '../types';
import {
  addMessage,
  logEditCorrection,
  getConfirmedOrdersOnDate,
  getOwnerProfile,
  updateOwnerProfile,
  getOrder,
  updateOrder,
  getThread,
  getCustomer,
  updateThread,
} from '../utils/dynamodb';
import { verifyAuth, ok, apiError, corsOk, body, ApiError } from '../utils/auth';
import type { Channel } from '../types';

async function getOAuthClient(ownerId: string) {
  const profile = await getOwnerProfile(ownerId);
  if (!profile) throw new Error('Owner profile not found');

  const cal = profile.calendarConnection as Record<string, unknown> | null;
  if (!cal?.accessToken) throw new Error('Google Calendar not connected');

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const expiryDate = cal.expiresAt ? new Date(cal.expiresAt as string).getTime() : undefined;
  oauth2.setCredentials({
    access_token: cal.accessToken as string,
    refresh_token: cal.refreshToken as string,
    expiry_date: expiryDate,
  });

  oauth2.on('tokens', async (tokens) => {
    const patch: Record<string, unknown> = {};
    if (tokens.access_token) patch['calendarConnection.accessToken'] = tokens.access_token;
    if (tokens.expiry_date) patch['calendarConnection.expiresAt'] = new Date(tokens.expiry_date).toISOString();
    if (Object.keys(patch).length > 0) {
      await updateOwnerProfile(ownerId, patch);
    }
  });

  return oauth2;
}

// POST /calendar/confirm
export async function confirmAndBookHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const { threadId, orderId, replyText, originalDraft } = body<Record<string, unknown>>(event);

    if (!threadId || !orderId || !replyText) {
      throw new ApiError(400, 'threadId, orderId, and replyText are required');
    }

    const order = await getOrder(orderId as string);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.ownerId !== ownerId) throw new ApiError(403, 'Access denied');
    if (!order.dueDate) throw new ApiError(422, 'Order must have a due date to confirm');

    const sameDayOrders = await getConfirmedOrdersOnDate(ownerId, order.dueDate);
    const hasConflict = sameDayOrders.length > 0;

    let calendarEventId: string | null = null;
    let calendarError: string | null = null;

    try {
      const auth = await getOAuthClient(ownerId);
      const calendar = google.calendar({ version: 'v3', auth });

      const thread = await getThread(threadId as string);
      const customer = thread ? await getCustomer(thread.customerId) : null;
      const customerName = customer?.name ?? 'Customer';

      const title = `🎂 ${customerName} — ${[order.size, ...order.flavors].filter(Boolean).join(', ') || 'Custom Cake'}`;
      const descriptionLines = [
        `Customer: ${customerName}`,
        order.servings ? `Servings: ${order.servings}` : null,
        order.flavors.length ? `Flavors: ${order.flavors.join(', ')}` : null,
        order.dietary.length ? `⚠️ DIETARY/ALLERGIES: ${order.dietary.join(', ')}` : null,
        order.designNotes ? `Design: ${order.designNotes}` : null,
        order.fulfillment ? `Fulfillment: ${order.fulfillment}` : null,
        order.quotedPrice ? `Quoted: $${order.quotedPrice}` : null,
      ].filter(Boolean) as string[];

      const startEnd = order.dueTime
        ? {
            start: { dateTime: `${order.dueDate}T${order.dueTime}:00`, timeZone: 'America/Chicago' },
            end: { dateTime: `${order.dueDate}T${order.dueTime}:00`, timeZone: 'America/Chicago' },
          }
        : {
            start: { date: order.dueDate },
            end: { date: order.dueDate },
          };

      const calEvent = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: { summary: title, description: descriptionLines.join('\n'), ...startEnd },
      });
      calendarEventId = calEvent.data.id ?? null;
    } catch (err) {
      console.error('Google Calendar push failed:', err);
      calendarError = (err as Error).message;
    }

    await updateOrder(orderId as string, { stage: 'confirmed', calendarEventId });

    const thread = await getThread(threadId as string);
    if (thread) {
      await addMessage(ownerId, threadId as string, 'outbound', thread.channel as Channel, replyText as string);
    }
    await logEditCorrection(ownerId, threadId as string, orderId as string, 'draft_reply', (originalDraft as string) ?? '', replyText as string);
    await updateThread(threadId as string, { status: 'waiting_on_customer', lastMessageFrom: 'owner' });

    return ok({ success: true, calendarEventId, calendarError, hasConflict, conflictCount: sameDayOrders.length });
  } catch (err) {
    return apiError(err);
  }
}

// POST /calendar/decline
export async function declineOrderHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const { threadId, orderId, replyText } = body<Record<string, unknown>>(event);

    if (!threadId || !replyText) throw new ApiError(400, 'threadId and replyText are required');

    if (orderId) {
      await updateOrder(orderId as string, { stage: 'declined' });
    }

    const thread = await getThread(threadId as string);
    if (thread) {
      await addMessage(ownerId, threadId as string, 'outbound', thread.channel as Channel, replyText as string);
    }
    await updateThread(threadId as string, { status: 'archived', lastMessageFrom: 'owner' });

    return ok({ success: true });
  } catch (err) {
    return apiError(err);
  }
}

// GET /calendar/auth-url
export async function getCalendarAuthUrlHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: ownerId,
      prompt: 'consent',
    });

    return ok({ url });
  } catch (err) {
    return apiError(err);
  }
}

// GET /calendar/callback  (public HTTP endpoint — no auth, OAuth redirect target)
export async function googleAuthCallbackHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { code, state } = event.queryStringParameters ?? {};

  if (!code || !state) {
    return { statusCode: 400, headers: {}, body: 'Missing required parameters' };
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2.getToken(code);
    const ownerId = state;

    await updateOwnerProfile(ownerId, {
      calendarConnection: {
        accessToken: tokens.access_token ?? '',
        refreshToken: tokens.refresh_token ?? '',
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body:
        '<html><body><script>window.close();</script>' +
        '<p style="font-family:sans-serif;text-align:center;margin-top:40px">Calendar connected! You can close this window.</p>' +
        '</body></html>',
    };
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return { statusCode: 500, headers: {}, body: 'Failed to connect calendar. Please try again.' };
  }
}
