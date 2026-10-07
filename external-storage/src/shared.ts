export const TASK_QUEUE = 'external-storage';

export interface Document {
  name: string;
  /** Raw text of a scanned document. Large enough to be worth keeping out of Workflow History. */
  content: string;
}

export interface ProcessingResult {
  documentName: string;
  /** Small enough to stay inline. */
  summary: string;
  /** Large, and offloaded on its way back to the Client. */
  extractedText: string;
}

const LOREM = [
  'the quick brown fox jumps over the lazy dog',
  'invoice total due on receipt net thirty terms apply',
  'shipment manifest reviewed and countersigned by the depot',
  'all measurements recorded in metric units unless noted',
];

/** Builds a deterministic document of roughly `sizeBytes` characters. */
export function makeDocument(name: string, sizeBytes: number): Document {
  const lines: string[] = [];
  let length = 0;
  for (let i = 0; length < sizeBytes; i++) {
    const line = `${String(i).padStart(6, '0')}  ${LOREM[i % LOREM.length]}`;
    lines.push(line);
    length += line.length + 1;
  }
  return { name, content: lines.join('\n') };
}
