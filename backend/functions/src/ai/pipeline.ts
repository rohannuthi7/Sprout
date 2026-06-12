import Anthropic from '@anthropic-ai/sdk';
import { AI_MODELS, MAX_TOKENS, SYSTEM_PROMPT_BASE } from './config';
import { AIEvalResultSchema, type ValidatedAIEvalResult } from '../types/schemas';
import type { ThreadContext } from '../types';
import { buildLearningExamples } from './learning';

const anthropic = new Anthropic();

const EVAL_TOOL: Anthropic.Tool = {
  name: 'evaluate_thread',
  description: 'Evaluate a customer thread and return structured analysis for the baker',
  input_schema: {
    type: 'object' as const,
    properties: {
      intent: {
        type: 'string',
        enum: ['inquiry', 'question', 'providing_details', 'confirming', 'changing', 'cancelling', 'other'],
        description: 'Intent of the most recent customer message',
      },
      updatedOrderFields: {
        type: 'object',
        description: 'Order fields to update based on new information in the conversation',
        properties: {
          stage: {
            type: 'string',
            enum: ['inquiry', 'quoted', 'confirming', 'confirmed', 'completed', 'declined', 'archived'],
          },
          dueDate: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD' },
          dueTime: { type: ['string', 'null'], description: 'Time HH:MM (24h)' },
          fulfillment: { type: ['string', 'null'], enum: ['pickup', 'delivery', null] },
          servings: { type: ['number', 'null'], description: 'Number of servings' },
          size: { type: ['string', 'null'], description: 'Cake size e.g. "6 inch", "half sheet"' },
          flavors: { type: 'array', items: { type: 'string' } },
          dietary: {
            type: 'array',
            items: { type: 'string' },
            description: 'ALL dietary restrictions and allergies — include every mention',
          },
          designNotes: { type: 'string' },
          budget: { type: ['number', 'null'] },
          quotedPrice: { type: ['number', 'null'] },
        },
      },
      stage: {
        type: 'string',
        enum: ['inquiry', 'quoted', 'confirming', 'confirmed', 'completed', 'declined', 'archived'],
        description: 'Suggested overall order stage after processing this message',
      },
      draftReply: {
        type: 'string',
        description: 'Suggested reply from the baker. Warm, human, professional. Always editable — never auto-sent.',
      },
      quote: {
        type: ['number', 'null'],
        description: 'Suggested quote in USD using pricing config, or null if not enough info',
      },
      needsAttention: {
        type: 'boolean',
        description: 'True if this thread needs immediate owner attention (e.g. safety issue, urgent request)',
      },
      missingInfo: {
        type: 'array',
        items: { type: 'string' },
        description: 'Information still needed to complete/quote the order',
      },
      safetyFlags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Safety-critical items: allergies, dietary restrictions, unconfirmed dates',
      },
      rollingSummary: {
        type: 'string',
        description: 'Updated concise 2-3 sentence summary of the entire thread (replaces previous summary)',
      },
    },
    required: [
      'intent',
      'updatedOrderFields',
      'stage',
      'draftReply',
      'quote',
      'needsAttention',
      'missingInfo',
      'safetyFlags',
      'rollingSummary',
    ],
  },
};

function buildPrompt(ctx: ThreadContext): string {
  const { thread, customer, order, recentMessages, pricingConfig, voiceProfile, correctionExamples } = ctx;

  const orderSection = order
    ? `## Current Order State\n${JSON.stringify(
        {
          stage: order.stage,
          dueDate: order.dueDate,
          dueTime: order.dueTime,
          fulfillment: order.fulfillment,
          servings: order.servings,
          size: order.size,
          flavors: order.flavors,
          dietary: order.dietary,
          designNotes: order.designNotes,
          budget: order.budget,
          quotedPrice: order.quotedPrice,
        },
        null,
        2
      )}`
    : '## Current Order State\nNo order created yet.';

  const pricingSection = pricingConfig
    ? `## Pricing Config\nBase prices by size: ${JSON.stringify(pricingConfig.basePricesBySize)}\nAdd-ons: ${JSON.stringify(pricingConfig.addOns)}\nRush fee rules: ${JSON.stringify(pricingConfig.rushFeeRules)}\nDelivery fee: $${pricingConfig.deliveryFee}\nDeposit: ${pricingConfig.depositPercent}%`
    : '## Pricing Config\nNot configured — do not suggest a quote.';

  const learningSection =
    correctionExamples.length > 0
      ? `## Baker's Previous Corrections (learn the voice and pricing style)\n${buildLearningExamples(correctionExamples)}`
      : '';

  const messagesText = recentMessages
    .map(m => `[${m.direction === 'inbound' ? customer.name : 'Baker'}]: ${m.rawText}`)
    .join('\n');

  return `## Thread Info
Customer: ${customer.name}
Channel: ${thread.channel}
Thread Summary: ${thread.rollingSummary || 'New conversation — no summary yet.'}

${orderSection}

${pricingSection}

## Baker's Voice Profile
${voiceProfile || 'Warm, friendly, professional small-business owner. Excited about custom cakes.'}

${learningSection}

## Recent Messages
${messagesText}

Evaluate this thread and fill out the tool. Remember: you SUGGEST — never auto-confirm. Flag ALL dietary/allergy information in safetyFlags.`;
}

export async function evaluateThread(ctx: ThreadContext): Promise<ValidatedAIEvalResult> {
  // Log key existence — never log the actual value
  console.log('[Sprout] evaluateThread: ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
  console.log('[Sprout] evaluateThread: calling model', AI_MODELS.strong, 'for thread', ctx.thread.id);
  const response = await anthropic.messages.create({
    model: AI_MODELS.strong,
    max_tokens: MAX_TOKENS.strong,
    system: SYSTEM_PROMPT_BASE,
    tools: [EVAL_TOOL],
    tool_choice: { type: 'tool', name: 'evaluate_thread' },
    messages: [{ role: 'user', content: buildPrompt(ctx) }],
  });

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolBlock) {
    throw new Error('LLM response contained no tool_use block');
  }

  const parsed = AIEvalResultSchema.safeParse(toolBlock.input);
  if (!parsed.success) {
    throw new Error(`LLM response failed validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

// Fast-tier: classify intent without full thread context
export async function classifyIntent(text: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: AI_MODELS.fast,
    max_tokens: MAX_TOKENS.fast,
    system: 'You classify customer messages for a custom cake bakery. Reply with exactly one word.',
    messages: [
      {
        role: 'user',
        content: `Classify the intent: inquiry, question, providing_details, confirming, changing, cancelling, or other.\n\nMessage: ${text}`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  return textBlock?.text.trim().toLowerCase() ?? 'other';
}

// Fast-tier: update the thread's rolling summary
export async function updateRollingSummary(
  currentSummary: string,
  newMessages: Array<{ direction: string; text: string }>,
  customerName: string
): Promise<string> {
  const messagesText = newMessages
    .map(m => `[${m.direction === 'inbound' ? customerName : 'Baker'}]: ${m.text}`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: AI_MODELS.fast,
    max_tokens: MAX_TOKENS.fast,
    system:
      'Summarize a custom cake order conversation in 2-3 sentences. Focus on: event date, cake type, dietary restrictions, confirmed details, and current stage.',
    messages: [
      {
        role: 'user',
        content: `Current summary: ${currentSummary || 'None yet.'}\n\nNew messages:\n${messagesText}\n\nUpdate the summary.`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  return textBlock?.text.trim() ?? currentSummary;
}
