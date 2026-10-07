import type { EventContext, ExecutionMetadata, HistoryExtractor } from '../internal/history-extractor.js';
import { timestampToISOString } from '../internal/history-timestamp.js';

export interface ExecutionTimes {
  startTime: string;
  closeTime: string;
}

export class ExecutionTimesExtractor implements HistoryExtractor<ExecutionTimes> {
  private firstEvent: EventContext['event'] | undefined;
  private lastEvent: EventContext['event'] | undefined;

  public constructor(private readonly execution: ExecutionMetadata) {}

  public onEvent({ event }: EventContext): void {
    this.firstEvent ??= event;
    this.lastEvent = event;
  }

  public finish(): ExecutionTimes {
    const startTime = timestampToISOString(this.firstEvent?.eventTime);
    const closeTime = timestampToISOString(this.lastEvent?.eventTime);
    if (!startTime || !closeTime) throw new Error(`History ${this.execution.runId} is missing event times`);
    return { startTime, closeTime };
  }
}
