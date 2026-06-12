import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PricingConfigSchema, OwnerProfileUpdateSchema } from '../types/schemas';
import {
  getOrdersByOwner,
  getOrder,
  updateOrder,
  getOwnerProfile,
  putOwnerProfile,
  updateOwnerProfile as dbUpdateOwnerProfile,
  getPricingConfig,
  putPricingConfig,
  logEditCorrection,
  getThread,
  getCustomer,
} from '../utils/dynamodb';
import { verifyAuth, ok, apiError, corsOk, body, ApiError } from '../utils/auth';
import { randomUUID } from 'crypto';

// GET /orders
export async function getOrdersHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const stage = event.queryStringParameters?.stage as import('../types').OrderStage | undefined;
    const orders = await getOrdersByOwner(ownerId, stage);

    // Resolve customer names server-side to avoid extra round-trips from the client
    const threadIds = [...new Set(orders.map(o => o.threadId))];
    const threads = await Promise.all(threadIds.map(tid => getThread(tid)));
    const customerIds = [...new Set(threads.filter(Boolean).map(t => t!.customerId))];
    const customers = await Promise.all(customerIds.map(cid => getCustomer(cid)));

    const threadMap = new Map(threads.filter(Boolean).map(t => [t!.id, t!]));
    const customerMap = new Map(customers.filter(Boolean).map(c => [c!.id, c!]));

    const ordersWithName = orders.map(o => {
      const thread = threadMap.get(o.threadId);
      const customer = thread ? customerMap.get(thread.customerId) : null;
      return { ...o, customerName: customer?.name ?? 'Customer' };
    });

    return ok({ orders: ordersWithName });
  } catch (err) {
    return apiError(err);
  }
}

// GET /orders/{orderId}
export async function getOrderHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const orderId = event.pathParameters?.orderId;
    if (!orderId) throw new ApiError(400, 'orderId is required');

    const order = await getOrder(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.ownerId !== ownerId) throw new ApiError(403, 'Access denied');

    const thread = await getThread(order.threadId);
    const customer = thread ? await getCustomer(thread.customerId) : null;

    return ok({ order: { ...order, customerName: customer?.name ?? 'Customer' } });
  } catch (err) {
    return apiError(err);
  }
}

// POST /orders/pricing
export async function savePricingConfigHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const parsed = PricingConfigSchema.safeParse(body(event));
    if (!parsed.success) throw new ApiError(400, parsed.error.message);

    const profile = await getOwnerProfile(ownerId);
    let configId: string = (profile?.pricingConfigId as string) ?? '';

    if (configId) {
      await putPricingConfig(configId, { ...parsed.data, ownerId });
    } else {
      configId = randomUUID();
      await putPricingConfig(configId, { ...parsed.data, ownerId });

      if (!profile) {
        await putOwnerProfile(ownerId, {
          businessName: '',
          voiceProfile: '',
          pricingConfigId: configId,
          calendarConnection: null,
          weeklyCapacity: 5,
        });
      } else {
        await dbUpdateOwnerProfile(ownerId, { pricingConfigId: configId });
      }
    }

    return ok({ success: true, configId });
  } catch (err) {
    return apiError(err);
  }
}

// GET /orders/pricing
export async function getPricingConfigHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const profile = await getOwnerProfile(ownerId);
    const configId = profile?.pricingConfigId as string | undefined;

    if (!configId) return ok({ config: null });

    const config = await getPricingConfig(configId);
    return ok({ config: config ? { id: configId, ...config } : null });
  } catch (err) {
    return apiError(err);
  }
}

// GET /profile
export async function getOwnerProfileHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    let profile = await getOwnerProfile(ownerId);

    if (!profile) {
      const defaults = {
        businessName: '',
        voiceProfile: '',
        pricingConfigId: '',
        calendarConnection: null,
        weeklyCapacity: 5,
      };
      await putOwnerProfile(ownerId, defaults);
      profile = defaults;
    }

    return ok({ profile: { id: ownerId, ...profile } });
  } catch (err) {
    return apiError(err);
  }
}

// PUT /profile
export async function updateOwnerProfileHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const parsed = OwnerProfileUpdateSchema.safeParse(body(event));
    if (!parsed.success) throw new ApiError(400, parsed.error.message);

    const profile = await getOwnerProfile(ownerId);
    if (!profile) {
      await putOwnerProfile(ownerId, {
        businessName: '',
        voiceProfile: '',
        pricingConfigId: '',
        calendarConnection: null,
        weeklyCapacity: 5,
        ...parsed.data,
      });
    } else {
      await dbUpdateOwnerProfile(ownerId, parsed.data as Record<string, unknown>);
    }

    return ok({ success: true });
  } catch (err) {
    return apiError(err);
  }
}

// POST /orders/{orderId}/quote
export async function logQuoteCorrectionHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsOk();
  try {
    const ownerId = await verifyAuth(event);
    const orderId = event.pathParameters?.orderId;
    if (!orderId) throw new ApiError(400, 'orderId is required');

    const { threadId, originalQuote, correctedQuote } = body<Record<string, unknown>>(event);

    if (!threadId || originalQuote === undefined || correctedQuote === undefined) {
      throw new ApiError(400, 'threadId, originalQuote, correctedQuote required');
    }

    const order = await getOrder(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.ownerId !== ownerId) throw new ApiError(403, 'Access denied');

    await updateOrder(orderId, { quotedPrice: correctedQuote as number });
    await logEditCorrection(ownerId, threadId as string, orderId, 'quote', String(originalQuote), String(correctedQuote));

    return ok({ success: true });
  } catch (err) {
    return apiError(err);
  }
}
