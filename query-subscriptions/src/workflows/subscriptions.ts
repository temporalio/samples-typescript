import { createActivityHandle, WorkflowInterceptors, setListener, defineQuery, condition } from '@temporalio/workflow';
import { createDraft, enablePatches, finishDraft } from 'immer';
import type { createActivities } from '../activities';

const { publish } = createActivityHandle<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '30 minutes',
});

export interface DurableObjectState<T> {
  state: T;
}

export interface Versioned<T> {
  version: number;
  value: T;
}

enablePatches();

/**
 * Adds a listener to the `getValue` query that returns versioned state.
 *
 * NOTE: This method should only be called once per Workflow.
 *
 * @returns an object with tracks mutations and publishes them to a redis stream
 * as JSON patches.
 */
export function subscribableState<T>(initialValue: T): { value: T } {
  state.draft.value = initialValue;
  state.current.value = initialValue;
  setListener(defineQuery<Versioned<T>>('getValue'), () => ({
    value: state.current.value,
    version: state.version,
  }));

  const proxy = {};
  Object.defineProperty(proxy, 'value', {
    get: () => {
      return state.draft.value;
    },
    set: (value: unknown) => {
      state.draft.value = value;
    },
  });
  return proxy as { value: T };
}

const state = {
  version: 0,
  current: {} as any,
  draft: undefined as any,
  lastPublishPromise: Promise.resolve(),
  syncComplete: false,
  workflowComplete: false,
};

export const interceptors = (): WorkflowInterceptors => ({
  internals: [
    {
      /**
       * When the Workflow is "activated" create a new draft of the state
       */
      activate(input, next) {
        if (input.batchIndex === 0) {
          state.draft = createDraft(state.current);
        }
        return next(input);
      },
      /**
       * Right before the Workflow activation is concluded, finish the draft
       * and publish a new version with the patches
       */
      concludeActivation({ commands }, next) {
        state.current = finishDraft(state.draft, (patches) => {
          if (patches.length === 0) return;
          state.version++;
          const { lastPublishPromise } = state;
          state.lastPublishPromise = lastPublishPromise.then(() =>
            // Ignore errors for simplicity
            publish(state.version, patches).catch(() => undefined)
          );
        });
        if (state.workflowComplete) {
          state.lastPublishPromise.then(() => (state.syncComplete = true));
        }
        try {
          return next({ commands });
        } finally {
          state.draft = undefined;
        }
      },
    },
  ],
  inbound: [
    {
      /**
       * Intercept Workflow execution and prevent it from completing until all
       * of the patches have been published.
       */
      async execute(input, next) {
        try {
          return await next(input);
        } finally {
          state.workflowComplete = true;
          await condition(() => state.syncComplete);
        }
      },
    },
  ],
  outbound: [],
});
