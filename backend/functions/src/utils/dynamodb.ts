import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import type { Thread, Customer, Order, Message, ThreadStatus, OrderStage, Channel } from '../types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const T = {
  threads: process.env.DYNAMODB_THREADS_TABLE ?? 'sprout-threads',
  messages: process.env.DYNAMODB_MESSAGES_TABLE ?? 'sprout-messages',
  orders: process.env.DYNAMODB_ORDERS_TABLE ?? 'sprout-orders',
  customers: process.env.DYNAMODB_CUSTOMERS_TABLE ?? 'sprout-customers',
  ownerProfile: process.env.DYNAMODB_OWNER_PROFILE_TABLE ?? 'sprout-owner-profile',
  pricingConfigs: process.env.DYNAMODB_PRICING_CONFIGS_TABLE ?? 'sprout-pricing-configs',
  editLogs: process.env.DYNAMODB_EDIT_LOGS_TABLE ?? 'sprout-edit-logs',
  appConfig: process.env.DYNAMODB_APP_CONFIG_TABLE ?? 'sprout-app-config',
};

function now(): string {
  return new Date().toISOString();
}

// ── Threads ─────────────────────────────────────────────────────────────────

export async function findThreadByChannelSender(
  ownerId: string,
  _channel: Channel,
  channelSenderId: string
): Promise<Thread | null> {
  const result = await db.send(new ScanCommand({
    TableName: T.threads,
    FilterExpression: 'channelSenderId = :csi AND ownerId = :oid',
    ExpressionAttributeValues: { ':csi': channelSenderId, ':oid': ownerId },
    Limit: 1,
  }));
  return result.Items?.[0] as Thread ?? null;
}

export async function createCustomer(
  ownerId: string,
  name: string,
  channel: Channel,
  channelValue: string
): Promise<Customer> {
  const id = randomUUID();
  const data: Customer = {
    id,
    ownerId,
    name,
    contactHandles: [{ channel, value: channelValue }],
    notes: '',
    createdAt: now(),
  };
  await db.send(new PutCommand({ TableName: T.customers, Item: data }));
  return data;
}

export async function createThread(
  ownerId: string,
  customerId: string,
  channel: Channel,
  channelSenderId: string
): Promise<Thread> {
  const id = randomUUID();
  const ts = now();
  const data: Thread = {
    id,
    ownerId,
    customerId,
    channel,
    channelSenderId,
    status: 'needs_reply',
    rollingSummary: '',
    lastMessageAt: ts,
    lastMessageFrom: 'customer',
  };
  await db.send(new PutCommand({ TableName: T.threads, Item: data }));
  return data;
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const result = await db.send(new GetCommand({ TableName: T.threads, Key: { id: threadId } }));
  return result.Item as Thread ?? null;
}

export async function getThreadsByOwner(ownerId: string): Promise<Thread[]> {
  const result = await db.send(new QueryCommand({
    TableName: T.threads,
    IndexName: 'byOwner',
    KeyConditionExpression: 'ownerId = :oid',
    ExpressionAttributeValues: { ':oid': ownerId },
  }));
  const threads = (result.Items ?? []) as Thread[];
  return threads.sort((a, b) => (b.lastMessageAt > a.lastMessageAt ? 1 : -1));
}

export async function updateThread(
  threadId: string,
  fields: Partial<Pick<Thread, 'status' | 'rollingSummary' | 'lastMessageAt' | 'lastMessageFrom'>>
): Promise<void> {
  const updates = { ...fields, lastMessageAt: fields.lastMessageAt ?? now() };
  const sets = Object.entries(updates).map(([k], i) => `#f${i} = :v${i}`);
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  Object.entries(updates).forEach(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:v${i}`] = v;
  });
  await db.send(new UpdateCommand({
    TableName: T.threads,
    Key: { id: threadId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function addMessage(
  ownerId: string,
  threadId: string,
  direction: 'inbound' | 'outbound',
  channel: Channel,
  rawText: string,
  attachments: string[] = []
): Promise<Message> {
  const id = randomUUID();
  const ts = now();
  const sk = `${ts}#${id}`;
  const data = {
    id,
    sk,
    ownerId,
    threadId,
    direction,
    channel,
    rawText,
    attachments,
    createdAt: ts,
  };
  await db.send(new PutCommand({ TableName: T.messages, Item: data }));
  return { id, ownerId, threadId, direction, channel, rawText, attachments, createdAt: ts };
}

export async function getMessages(threadId: string, limit = 50): Promise<Message[]> {
  const result = await db.send(new QueryCommand({
    TableName: T.messages,
    KeyConditionExpression: 'threadId = :tid',
    ExpressionAttributeValues: { ':tid': threadId },
    ScanIndexForward: true, // chronological order
    Limit: Math.min(limit, 200),
  }));
  return (result.Items ?? []).map(({ sk: _sk, ...rest }) => rest as Message);
}

export async function getRecentMessages(threadId: string, limit: number): Promise<Message[]> {
  const result = await db.send(new QueryCommand({
    TableName: T.messages,
    KeyConditionExpression: 'threadId = :tid',
    ExpressionAttributeValues: { ':tid': threadId },
    ScanIndexForward: false, // newest first
    Limit: limit,
  }));
  const msgs = (result.Items ?? []).map(({ sk: _sk, ...rest }) => rest as Message);
  return msgs.reverse(); // back to chronological
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function createOrUpdateOrder(
  ownerId: string,
  threadId: string,
  fields: Partial<Omit<Order, 'id' | 'ownerId' | 'threadId' | 'createdAt' | 'updatedAt'>>
): Promise<Order> {
  // Check if an order already exists for this thread
  const existing = await getOrderForThread(threadId);

  if (existing) {
    const ts = now();
    const updateFields = { ...fields, updatedAt: ts };
    const sets = Object.entries(updateFields).map(([k], i) => `#f${i} = :v${i}`);
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    Object.entries(updateFields).forEach(([k, v], i) => {
      names[`#f${i}`] = k;
      values[`:v${i}`] = v;
    });
    await db.send(new UpdateCommand({
      TableName: T.orders,
      Key: { id: existing.id },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }));
    return { ...existing, ...updateFields };
  }

  const id = randomUUID();
  const ts = now();
  const data: Order = {
    id,
    ownerId,
    threadId,
    stage: 'inquiry',
    dueDate: null,
    dueTime: null,
    fulfillment: null,
    servings: null,
    size: null,
    flavors: [],
    dietary: [],
    designNotes: '',
    referenceImages: [],
    budget: null,
    quotedPrice: null,
    depositStatus: 'none',
    calendarEventId: null,
    ...fields,
    createdAt: ts,
    updatedAt: ts,
  };
  await db.send(new PutCommand({ TableName: T.orders, Item: data }));
  return data;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const result = await db.send(new GetCommand({ TableName: T.orders, Key: { id: orderId } }));
  return result.Item as Order ?? null;
}

export async function getOrderForThread(threadId: string): Promise<Order | null> {
  const result = await db.send(new ScanCommand({
    TableName: T.orders,
    FilterExpression: 'threadId = :tid',
    ExpressionAttributeValues: { ':tid': threadId },
  }));
  const items = (result.Items ?? []) as Order[];
  items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return items[0] ?? null;
}

export async function getOrdersByOwner(ownerId: string, stage?: OrderStage): Promise<Order[]> {
  let filterExpr = 'ownerId = :oid';
  const attrValues: Record<string, unknown> = { ':oid': ownerId };
  const attrNames: Record<string, string> | undefined = stage ? { '#st': 'stage' } : undefined;
  if (stage) {
    filterExpr += ' AND #st = :stage';
    attrValues[':stage'] = stage;
  }
  const result = await db.send(new ScanCommand({
    TableName: T.orders,
    FilterExpression: filterExpr,
    ...(attrNames && { ExpressionAttributeNames: attrNames }),
    ExpressionAttributeValues: attrValues,
  }));
  const orders = (result.Items ?? []) as Order[];
  return orders.sort((a, b) => {
    const da = a.dueDate ?? '';
    const db_ = b.dueDate ?? '';
    return da < db_ ? -1 : da > db_ ? 1 : 0;
  });
}

export async function getConfirmedOrdersOnDate(ownerId: string, date: string): Promise<Order[]> {
  const result = await db.send(new ScanCommand({
    TableName: T.orders,
    FilterExpression: 'ownerId = :oid AND #st = :confirmed AND dueDate = :date',
    ExpressionAttributeNames: { '#st': 'stage' },
    ExpressionAttributeValues: { ':oid': ownerId, ':confirmed': 'confirmed', ':date': date },
  }));
  return (result.Items ?? []) as Order[];
}

export async function updateOrder(
  orderId: string,
  fields: Partial<Omit<Order, 'id' | 'ownerId' | 'threadId' | 'createdAt'>>
): Promise<void> {
  const updates = { ...fields, updatedAt: now() };
  const sets = Object.entries(updates).map(([k], i) => `#f${i} = :v${i}`);
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  Object.entries(updates).forEach(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:v${i}`] = v;
  });
  await db.send(new UpdateCommand({
    TableName: T.orders,
    Key: { id: orderId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function getCustomer(customerId: string): Promise<Customer | null> {
  const result = await db.send(new GetCommand({ TableName: T.customers, Key: { id: customerId } }));
  return result.Item as Customer ?? null;
}

export async function getCustomersByOwner(ownerId: string): Promise<Customer[]> {
  const result = await db.send(new ScanCommand({
    TableName: T.customers,
    FilterExpression: 'ownerId = :oid',
    ExpressionAttributeValues: { ':oid': ownerId },
  }));
  const list = (result.Items ?? []) as Customer[];
  return list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

// ── Owner Profile ─────────────────────────────────────────────────────────────

export async function getOwnerProfile(ownerId: string): Promise<Record<string, unknown> | null> {
  // Table PK is "id", not "ownerId"
  const result = await db.send(new GetCommand({ TableName: T.ownerProfile, Key: { id: ownerId } }));
  return result.Item ?? null;
}

export async function putOwnerProfile(ownerId: string, data: Record<string, unknown>): Promise<void> {
  await db.send(new PutCommand({ TableName: T.ownerProfile, Item: { id: ownerId, ...data } }));
}

export async function updateOwnerProfile(
  ownerId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const sets = Object.entries(fields).map(([k], i) => `#f${i} = :v${i}`);
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  Object.entries(fields).forEach(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:v${i}`] = v;
  });
  await db.send(new UpdateCommand({
    TableName: T.ownerProfile,
    Key: { id: ownerId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

// ── Pricing Configs ────────────────────────────────────────────────────────────

export async function getPricingConfig(configId: string): Promise<Record<string, unknown> | null> {
  const result = await db.send(new GetCommand({ TableName: T.pricingConfigs, Key: { id: configId } }));
  return result.Item ?? null;
}

export async function putPricingConfig(configId: string, data: Record<string, unknown>): Promise<void> {
  await db.send(new PutCommand({ TableName: T.pricingConfigs, Item: { id: configId, ...data } }));
}

// ── Edit Logs ─────────────────────────────────────────────────────────────────

export async function logEditCorrection(
  ownerId: string,
  threadId: string,
  orderId: string | null,
  fieldType: 'draft_reply' | 'quote',
  originalValue: string,
  correctedValue: string
): Promise<void> {
  if (originalValue === correctedValue) return;
  const id = randomUUID();
  const ts = now();
  await db.send(new PutCommand({
    TableName: T.editLogs,
    Item: {
      ownerId,
      sk: `${ts}#${id}`,
      id,
      threadId,
      orderId,
      fieldType,
      originalValue,
      correctedValue,
      createdAt: ts,
    },
  }));
}

export async function getEditLogs(ownerId: string, limit: number): Promise<import('../types').EditCorrectionLog[]> {
  const result = await db.send(new QueryCommand({
    TableName: T.editLogs,
    KeyConditionExpression: 'ownerId = :oid',
    ExpressionAttributeValues: { ':oid': ownerId },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return (result.Items ?? []).map(({ sk: _sk, ...rest }) => rest as import('../types').EditCorrectionLog);
}

// ── App Config ─────────────────────────────────────────────────────────────────

export async function getDefaultOwnerId(): Promise<string> {
  const result = await db.send(new GetCommand({ TableName: T.appConfig, Key: { id: 'global' } }));
  const ownerId = result.Item?.defaultOwnerId;
  if (!ownerId) throw new Error('App not configured: defaultOwnerId missing from appConfig');
  return ownerId as string;
}

export { db, T, now, DeleteCommand };
