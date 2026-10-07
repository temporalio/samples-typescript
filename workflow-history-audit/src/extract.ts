import { ExecutionTimesExtractor } from './extractors/execution-times.js';
import { WorkflowTasksExtractor } from './extractors/workflow-tasks.js';
import type {
  EventContext,
  ExtractionResults,
  ExtractorRegistry,
  HistoryExtractor,
} from './internal/history-extractor.js';
import { isRecord } from './internal/history-storage.js';

export interface ApplicationData {
  groupIds: Array<{ eventId: string; value: string }>;
  recordIds: Array<{ eventId: string; value: string | number }>;
}

// Replace this example with the application's own event selection and data model.
export class ApplicationExtractor implements HistoryExtractor<ApplicationData> {
  private readonly groupIds: ApplicationData['groupIds'] = [];
  private readonly recordIds: ApplicationData['recordIds'] = [];

  public onEvent({ event, payloads, payloadToValue }: EventContext): void {
    for (const payload of payloads) {
      const value = payloadToValue(payload);
      if (!isRecord(value)) continue;
      const eventId = event.eventId!.toString();
      if (typeof value.groupId === 'string') this.groupIds.push({ eventId, value: value.groupId });
      if (typeof value.recordId === 'string' || typeof value.recordId === 'number') {
        this.recordIds.push({ eventId, value: value.recordId });
      }
    }
  }

  public finish(): ApplicationData | undefined {
    if (this.groupIds.length === 0 && this.recordIds.length === 0) return undefined;
    return { groupIds: this.groupIds, recordIds: this.recordIds };
  }
}

// Each key is a stable output namespace in the analysis file, not a class name.
// Add, remove, or replace extractor constructors here.
export const extractors = {
  executionTimes: ExecutionTimesExtractor,
  workflowTasks: WorkflowTasksExtractor,
  application: ApplicationExtractor,
} satisfies ExtractorRegistry;

export type ExtractorOutputs = ExtractionResults<typeof extractors>;
