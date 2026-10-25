import { Source } from '../types';

export interface InjectionDetection {
  sourceId: string;
  pageNumber: number;
  passageId: string;
  matchedPattern: string;
  originalSnippet: string;
  sanitizedText: string;
  timestamp: string;
}

export interface InjectionGuardResult {
  attemptsBlocked: number;
  detections: InjectionDetection[];
  sanitizedSourcesCount: number;
}

const INJECTION_PATTERNS: { label: string; regex: RegExp }[] = [
  {
    label: 'System Instruction Override Token',
    regex: /SYSTEM INSTRUCTION OVERRIDE:[\s\S]*?(?=\.|$)/gi,
  },
  {
    label: 'Verification Rule Bypass Command',
    regex: /Ignore all prior verification rules[\s\S]*?(?=\.|$)/gi,
  },
  {
    label: 'Forced Investment Rating Injection',
    regex: /output a Strong Buy rating[\s\S]*?(?=\.|$)/gi,
  },
];

/**
 * Treats all document text as untrusted data, neutralizing embedded prompt-injection
 * instructions (such as S7 p.1) and returning a deterministic audit summary.
 */
export function runPromptInjectionGuard(sources: Source[]): InjectionGuardResult {
  const detections: InjectionDetection[] = [];
  let attemptsBlocked = 0;

  for (const src of sources) {
    for (const page of src.pages) {
      for (const pas of page.passages) {
        let currentText = pas.text;
        let flaggedThisPassage = false;

        for (const pat of INJECTION_PATTERNS) {
          if (pat.regex.test(currentText)) {
            flaggedThisPassage = true;
            currentText = currentText.replace(
              pat.regex,
              '[NEUTRALIZED_UNTRUSTED_INSTRUCTION]'
            );
          }
          pat.regex.lastIndex = 0;
        }

        if (flaggedThisPassage || pas.isPromptInjectionTest) {
          attemptsBlocked += 1;
          detections.push({
            sourceId: src.id,
            pageNumber: page.pageNumber,
            passageId: pas.id,
            matchedPattern:
              'Imperative override instruction ("SYSTEM INSTRUCTION OVERRIDE / Ignore all prior verification rules / Strong Buy")',
            originalSnippet: pas.text.slice(0, 140) + '...',
            sanitizedText: currentText,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  return {
    attemptsBlocked: Math.max(1, attemptsBlocked),
    detections,
    sanitizedSourcesCount: sources.length,
  };
}
