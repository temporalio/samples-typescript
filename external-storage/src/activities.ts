import { log } from '@temporalio/activity';
import type { Document } from './shared';

/**
 * Stands in for OCR or text extraction: takes a large document in and returns a large
 * string out. Both the argument and the return value are offloaded, so neither ever
 * reaches Temporal Server.
 *
 * Nothing here is aware of external storage. By the time the Activity runs, the Worker
 * has already retrieved the argument through the driver; the returned string is stored
 * on the way back out.
 */
export async function extractText(document: Document): Promise<string> {
  log.info('extracting text', { document: document.name, contentLength: document.content.length });

  const extractedText = document.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  log.info('extracted text', { extractedLength: extractedText.length });
  return extractedText;
}

/**
 * Takes a large argument and returns a small result, so its argument is offloaded and
 * its return value stays inline. Mixing both in one Workflow shows the threshold at
 * work: offloading is decided per payload, by size, not per Activity.
 */
export async function summarize(text: string): Promise<string> {
  const lines = text.split('\n');
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  return `${lines.length} lines, ${words.length} words, ${text.length} characters`;
}
