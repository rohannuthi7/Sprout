// Tests for AI pipeline helpers — mocks Anthropic SDK to avoid real API calls

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    __mockCreate: mockCreate,
  };
});

import { buildLearningExamples, rankCorrectionLogs } from '../src/ai/learning';
import type { EditCorrectionLog } from '../src/types';

// Minimal stub for Firestore Timestamp
const fakeTs = { toMillis: () => Date.now() } as unknown as FirebaseFirestore.Timestamp;

function makeDraftLog(i: number): EditCorrectionLog {
  return {
    id: `log_${i}`,
    ownerId: 'owner1',
    threadId: 'thread1',
    orderId: 'order1',
    fieldType: 'draft_reply',
    originalValue: `AI draft ${i} — here is some generated text`,
    correctedValue: `Owner version ${i} — a more personal touch`,
    createdAt: fakeTs,
  };
}

function makeQuoteLog(orig: number, corr: number): EditCorrectionLog {
  return {
    id: 'quote_log',
    ownerId: 'owner1',
    threadId: 'thread1',
    orderId: 'order1',
    fieldType: 'quote',
    originalValue: String(orig),
    correctedValue: String(corr),
    createdAt: fakeTs,
  };
}

describe('buildLearningExamples', () => {
  it('returns empty string for empty logs', () => {
    expect(buildLearningExamples([])).toBe('');
  });

  it('formats a draft reply correction', () => {
    const output = buildLearningExamples([makeDraftLog(1)]);
    expect(output).toContain('Draft reply correction');
    expect(output).toContain('AI draft 1');
    expect(output).toContain('Owner version 1');
    expect(output).toContain('Example 1');
  });

  it('formats a quote correction', () => {
    const output = buildLearningExamples([makeQuoteLog(200, 275)]);
    expect(output).toContain('Quote correction');
    expect(output).toContain('$200');
    expect(output).toContain('$275');
  });

  it('caps output at 5 examples', () => {
    const logs = Array.from({ length: 10 }, (_, i) => makeDraftLog(i));
    const output = buildLearningExamples(logs);
    const count = (output.match(/Example \d+/g) ?? []).length;
    expect(count).toBeLessThanOrEqual(5);
  });

  it('truncates long values at 150 chars with ellipsis', () => {
    const longLog: EditCorrectionLog = {
      ...makeDraftLog(1),
      originalValue: 'A'.repeat(300),
      correctedValue: 'B'.repeat(300),
    };
    const output = buildLearningExamples([longLog]);
    expect(output).toContain('...');
    // Should not contain the full 300 chars
    expect(output).not.toContain('A'.repeat(200));
  });

  it('shows multiple examples with correct numbering', () => {
    const logs = [makeDraftLog(1), makeQuoteLog(100, 150), makeDraftLog(2)];
    const output = buildLearningExamples(logs);
    expect(output).toContain('Example 1');
    expect(output).toContain('Example 2');
    expect(output).toContain('Example 3');
  });
});

describe('rankCorrectionLogs', () => {
  it('returns empty array for empty input', () => {
    expect(rankCorrectionLogs([])).toEqual([]);
  });

  it('interleaves reply then quote logs', () => {
    const logs: EditCorrectionLog[] = [
      makeDraftLog(1),
      makeQuoteLog(100, 120),
      makeDraftLog(2),
      makeQuoteLog(200, 230),
    ];
    const ranked = rankCorrectionLogs(logs);
    expect(ranked[0].fieldType).toBe('draft_reply');
    expect(ranked[1].fieldType).toBe('quote');
    expect(ranked[2].fieldType).toBe('draft_reply');
    expect(ranked[3].fieldType).toBe('quote');
  });

  it('handles only draft_reply logs', () => {
    const logs = Array.from({ length: 6 }, (_, i) => makeDraftLog(i));
    const ranked = rankCorrectionLogs(logs);
    expect(ranked.length).toBeLessThanOrEqual(5);
    ranked.forEach(l => expect(l.fieldType).toBe('draft_reply'));
  });

  it('handles only quote logs', () => {
    const logs: EditCorrectionLog[] = Array.from({ length: 6 }, (_, i) => ({
      ...makeQuoteLog(100 + i * 10, 150 + i * 10),
      id: `q${i}`,
    }));
    const ranked = rankCorrectionLogs(logs);
    expect(ranked.length).toBeLessThanOrEqual(5);
    ranked.forEach(l => expect(l.fieldType).toBe('quote'));
  });

  it('returns at most 5 items', () => {
    const logs = [
      ...Array.from({ length: 4 }, (_, i) => makeDraftLog(i)),
      ...Array.from({ length: 4 }, (_, i) => ({ ...makeQuoteLog(i * 10, i * 10 + 5), id: `q${i}` })),
    ];
    expect(rankCorrectionLogs(logs).length).toBeLessThanOrEqual(5);
  });
});

describe('AI_MODELS config', () => {
  it('exports fast and strong tier model IDs', () => {
    const { AI_MODELS } = require('../src/ai/config');
    expect(AI_MODELS.fast).toBeTruthy();
    expect(AI_MODELS.strong).toBeTruthy();
    expect(typeof AI_MODELS.fast).toBe('string');
    expect(typeof AI_MODELS.strong).toBe('string');
  });

  it('has different models for fast and strong tiers', () => {
    const { AI_MODELS } = require('../src/ai/config');
    expect(AI_MODELS.fast).not.toBe(AI_MODELS.strong);
  });

  it('exports MAX_TOKENS with higher limit for strong tier', () => {
    const { MAX_TOKENS } = require('../src/ai/config');
    expect(MAX_TOKENS.strong).toBeGreaterThan(MAX_TOKENS.fast);
  });
});
