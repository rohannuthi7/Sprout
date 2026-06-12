export type Channel = 'paste' | 'web_intake' | 'sms' | 'email' | 'instagram';

export interface ContactHandle {
  channel: Channel;
  value: string;
}

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  contactHandles: ContactHandle[];
  notes: string;
  createdAt: string; // ISO 8601
}

export type ThreadStatus = 'needs_reply' | 'parked' | 'waiting_on_customer' | 'archived';

export interface Thread {
  id: string;
  ownerId: string;
  customerId: string;
  channel: Channel;
  channelSenderId: string;
  status: ThreadStatus;
  rollingSummary: string;
  lastMessageAt: string; // ISO 8601
  lastMessageFrom: 'customer' | 'owner';
}

export interface Message {
  id: string;
  ownerId: string;
  threadId: string;
  direction: 'inbound' | 'outbound';
  channel: Channel;
  rawText: string;
  attachments: string[];
  createdAt: string; // ISO 8601
}

export type OrderStage =
  | 'inquiry'
  | 'quoted'
  | 'confirming'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'archived';

export type Fulfillment = 'pickup' | 'delivery';
export type DepositStatus = 'none' | 'requested' | 'paid';

export interface Order {
  id: string;
  ownerId: string;
  threadId: string;
  stage: OrderStage;
  dueDate: string | null;
  dueTime: string | null;
  fulfillment: Fulfillment | null;
  servings: number | null;
  size: string | null;
  flavors: string[];
  dietary: string[];
  designNotes: string;
  referenceImages: string[];
  budget: number | null;
  quotedPrice: number | null;
  depositStatus: DepositStatus;
  calendarEventId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  customerName?: string; // resolved server-side in list responses
}

export interface AddOn {
  name: string;
  price: number;
}

export interface RushFeeRule {
  daysThreshold: number;
  feePercent: number;
}

export interface PricingConfig {
  id: string;
  ownerId: string;
  basePricesBySize: Record<string, number>;
  addOns: AddOn[];
  rushFeeRules: RushFeeRule[];
  deliveryFee: number;
  depositPercent: number;
}

export interface OwnerProfile {
  id: string;
  businessName: string;
  voiceProfile: string;
  pricingConfigId: string;
  calendarConnection: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string | null; // ISO 8601
  } | null;
  weeklyCapacity: number;
}

export type MessageIntent =
  | 'inquiry'
  | 'question'
  | 'providing_details'
  | 'confirming'
  | 'changing'
  | 'cancelling'
  | 'other';

export interface AIEvalResult {
  intent: MessageIntent;
  updatedOrderFields: Partial<Order>;
  stage: OrderStage;
  draftReply: string;
  quote: number | null;
  needsAttention: boolean;
  missingInfo: string[];
  safetyFlags: string[];
  rollingSummary: string;
}

// What comes back from the intake API endpoint
export interface IntakeResult {
  threadId: string;
  orderId: string | null;
  evalResult: AIEvalResult | null;
  parseError: boolean;
  rawMessage?: string;
}

// Full card data for the flashcard stack
export interface FlashCardData {
  thread: Thread;
  customer: Customer;
  order: Order | null;
  messages: Message[];
  evalResult: AIEvalResult | null;
}
