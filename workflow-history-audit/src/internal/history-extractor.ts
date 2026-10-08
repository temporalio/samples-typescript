import type { Payload } from '@temporalio/common';
import type { DecodedPayload } from '@temporalio/common/lib/internal-non-workflow/index.js';
import type { DecodedHistoryEvent } from './history-payload-decoder.js';
import type { HistoryEnvelope } from './history-storage.js';

export type ExecutionMetadata = Readonly<Pick<HistoryEnvelope, 'namespace' | 'workflowId' | 'runId' | 'taskQueue'>>;

export interface EventContext {
  readonly event: Readonly<DecodedHistoryEvent>;
  readonly payloads: readonly DecodedPayload[];
  readonly payloadToValue: <T = unknown>(payload: Payload) => T;
}

/**
 * An extractor owns its state for one history. Events arrive in history order;
 * callbacks are synchronous, and finish runs after all events and may return no output.
 */
export interface HistoryExtractor<Output = unknown> {
  onEvent(context: EventContext): void;
  finish(): Output | undefined;
}

export type ExtractorConstructor<Output = unknown> = new (execution: ExecutionMetadata) => HistoryExtractor<Output>;
export type ExtractorRegistry = Record<string, ExtractorConstructor>;

export type ExtractionResults<Registry extends ExtractorRegistry> = {
  [Key in keyof Registry]?: Exclude<ReturnType<InstanceType<Registry[Key]>['finish']>, undefined>;
};

/**
 * Runs independent extractor instances and places each result under its registry
 * key. Results are never merged, so extractors cannot overwrite each other's fields.
 */
export class CompositeExtractor<Registry extends ExtractorRegistry>
  implements HistoryExtractor<ExtractionResults<Registry>>
{
  private readonly instances: Array<[string, HistoryExtractor]>;

  public constructor(registry: Registry, execution: ExecutionMetadata) {
    this.instances = Object.entries(registry).map(([key, Extractor]) => [key, new Extractor(execution)]);
  }

  public onEvent(context: EventContext): void {
    for (const [, extractor] of this.instances) extractor.onEvent(context);
  }

  public finish(): ExtractionResults<Registry> {
    const outputs: Array<[string, unknown]> = [];
    for (const [key, extractor] of this.instances) {
      const output = extractor.finish();
      if (output !== undefined) outputs.push([key, output]);
    }
    return Object.fromEntries(outputs) as ExtractionResults<Registry>;
  }
}
