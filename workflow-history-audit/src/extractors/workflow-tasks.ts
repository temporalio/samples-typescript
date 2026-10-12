import type { temporal } from '@temporalio/proto';
import type { EventContext, HistoryExtractor } from '../internal/history-extractor.js';
import { timestampToISOString } from '../internal/history-timestamp.js';

export interface WorkflowTask {
  scheduledEventId?: string;
  startedEventId?: string;
  finishedEventId?: string;
  startedAt?: string;
  finishedAt?: string;
  status: 'started' | 'completed' | 'failed' | 'timed-out';
  identity?: string;
  buildId?: string;
  failureCause?: temporal.api.enums.v1.WorkflowTaskFailedCause;
  timeoutType?: temporal.api.enums.v1.TimeoutType;
}

export class WorkflowTasksExtractor implements HistoryExtractor<WorkflowTask[]> {
  private readonly startedTasks = new Map<string, WorkflowTask>();
  private readonly tasks: WorkflowTask[] = [];

  public onEvent({ event }: EventContext): void {
    const started = event.workflowTaskStartedEventAttributes;
    if (started) {
      const startedEventId = event.eventId!.toString();
      const task: WorkflowTask = {
        scheduledEventId: eventReference(started.scheduledEventId),
        startedEventId,
        startedAt: timestampToISOString(event.eventTime),
        status: 'started',
        identity: started.identity || undefined,
        buildId: started.workerVersion?.buildId || undefined,
      };
      this.startedTasks.set(startedEventId, task);
      this.tasks.push(task);
      return;
    }
    const completed = event.workflowTaskCompletedEventAttributes;
    const failed = event.workflowTaskFailedEventAttributes;
    const timedOut = event.workflowTaskTimedOutEventAttributes;
    const finished = completed ?? failed ?? timedOut;
    if (!finished) return;

    const startedEventId = eventReference(finished.startedEventId);
    let task = startedEventId ? this.startedTasks.get(startedEventId) : undefined;
    if (!task) {
      task = {
        scheduledEventId: eventReference(finished.scheduledEventId),
        startedEventId,
        status: 'started',
      };
      this.tasks.push(task);
    }
    task.finishedEventId = event.eventId!.toString();
    task.finishedAt = timestampToISOString(event.eventTime);
    task.status = completed ? 'completed' : failed ? 'failed' : 'timed-out';
    task.failureCause = failed?.cause ?? undefined;
    task.timeoutType = timedOut?.timeoutType ?? undefined;
    task.scheduledEventId ??= eventReference(finished.scheduledEventId);

    // Keep the worker that picked up the task, not a server-generated failure's identity.
    const finishedIdentity = completed?.identity || failed?.identity;
    if (!task.identity && finishedIdentity && finishedIdentity !== 'history-service') {
      task.identity = finishedIdentity;
    }
    // Prefer the version reported by the finishing worker when it is available.
    task.buildId =
      completed?.deploymentVersion?.buildId ||
      completed?.deployment?.buildId ||
      completed?.workerVersion?.buildId ||
      failed?.workerVersion?.buildId ||
      completed?.binaryChecksum ||
      failed?.binaryChecksum ||
      task.buildId;
  }

  public finish(): WorkflowTask[] {
    return this.tasks;
  }
}

function eventReference(id: { toString(): string } | null | undefined): string | undefined {
  const value = id?.toString();
  return value && value !== '0' ? value : undefined;
}
