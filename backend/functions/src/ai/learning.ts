import type { EditCorrectionLog } from '../types';

const MAX_EXAMPLES = 5;

export function buildLearningExamples(logs: EditCorrectionLog[]): string {
  if (logs.length === 0) return '';

  return logs
    .slice(0, MAX_EXAMPLES)
    .map((log, i) => {
      if (log.fieldType === 'draft_reply') {
        return `Example ${i + 1} (Draft reply correction):
AI suggested: "${truncate(log.originalValue, 150)}"
Owner changed to: "${truncate(log.correctedValue, 150)}"`;
      } else {
        return `Example ${i + 1} (Quote correction):
AI suggested: $${log.originalValue}
Owner changed to: $${log.correctedValue}`;
      }
    })
    .join('\n\n');
}

// Interleave reply and quote corrections, prioritizing reply examples.
// Voice corrections are more subjective and harder to derive from code.
export function rankCorrectionLogs(logs: EditCorrectionLog[]): EditCorrectionLog[] {
  const replyLogs = logs.filter(l => l.fieldType === 'draft_reply');
  const quoteLogs = logs.filter(l => l.fieldType === 'quote');

  const ranked: EditCorrectionLog[] = [];
  let ri = 0;
  let qi = 0;
  while (ranked.length < MAX_EXAMPLES && (ri < replyLogs.length || qi < quoteLogs.length)) {
    if (ri < replyLogs.length) ranked.push(replyLogs[ri++]);
    if (ranked.length < MAX_EXAMPLES && qi < quoteLogs.length) ranked.push(quoteLogs[qi++]);
  }
  return ranked;
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}
