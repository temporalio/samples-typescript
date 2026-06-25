/**
 * Stream LLM output to the terminal, handling retries.
 *
 * Starts an `llmStreaming` workflow, subscribes to its delta / complete /
 * retry topics, and renders the model's output to stdout as it arrives. On a
 * retry event (the activity is on attempt > 1), the consumer rewinds its
 * rendered output with ANSI escapes and starts fresh — so a killed worker
 * doesn't leave a half-finished response stuck on screen followed by the
 * retried attempt's full output.
 *
 * Requires `OPENAI_API_KEY` in the environment.
 *
 * Run the LLM worker first (`npm run start.llm`), then `npm run workflow.llm`.
 *
 * To see retry handling in action, kill the LLM worker mid-stream (Ctrl-C in
 * its terminal) and start it again. The consumer will clear its accumulated
 * output on the retry event and re-render the retried attempt's output from
 * scratch.
 */
import { Client, Connection } from '@temporalio/client';
import { defaultPayloadConverter } from '@temporalio/common';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { nanoid } from 'nanoid';
import {
  DEFAULT_LLM_MODEL,
  LLM_TASK_QUEUE,
  TOPIC_COMPLETE,
  TOPIC_DELTA,
  TOPIC_RETRY,
  type RetryEvent,
  type TextComplete,
  type TextDelta,
} from './llm-shared';
import { llmStreaming } from './workflows-llm';

// Long enough that you can comfortably kill the worker mid-stream and watch
// the retry render. Adjust to taste.
const DEFAULT_PROMPT =
  'Write a 500-word comparison of Paxos, Raft, and Viewstamped Replication for ' +
  'a new distributed-systems engineer. Cover the core ideas, leader election, ' +
  'normal-case operation, reconfiguration, and the practical tradeoffs that ' +
  'show up when implementing each. Use short paragraphs.';

// ANSI cursor save / restore. `\x1b[s` saves the current cursor position,
// `\x1b[u` restores it, `\x1b[J` clears from the cursor to the end of the
// screen. Save once before the first delta, and on retry restore + clear-to-
// end so the failed attempt's rendered output disappears regardless of how it
// was wrapped by the terminal. Save again afterwards so a second retry can
// rewind to the same point.
const ANSI_SAVE = '\x1b[s';
const ANSI_RESTORE_AND_CLEAR = '\x1b[u\x1b[J';

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const workflowId = `workflow-stream-llm-${nanoid(8)}`;
  const input = { prompt: DEFAULT_PROMPT, model: DEFAULT_LLM_MODEL };
  const handle = await client.workflow.start(llmStreaming, {
    args: [input],
    taskQueue: LLM_TASK_QUEUE,
    workflowId,
  });

  // Print a header so the user sees something immediately. The response will
  // start streaming below it once the first delta arrives — until then this
  // is the only line on screen.
  console.log(`[llm ${workflowId}] streaming response from ${input.model}, awaiting first token...`);
  console.log();
  process.stdout.write(ANSI_SAVE);

  const stream = WorkflowStreamClient.create(client, workflowId);

  // Subscribe without `resultType` so `item.data` is the raw `Payload`, then
  // dispatch on `item.topic` and decode against the right type per topic.
  // The loop ends either on the `complete` terminator (break) or because the
  // iterator naturally exhausts when the workflow reaches a terminal state
  // without one (activity exhausted retries, etc.). Either way the
  // `handle.result()` below either returns the full text or throws the
  // workflow's failure.
  let done = false;
  for await (const item of stream.subscribe([TOPIC_DELTA, TOPIC_RETRY, TOPIC_COMPLETE])) {
    if (item.topic === TOPIC_RETRY) {
      const evt = defaultPayloadConverter.fromPayload<RetryEvent>(item.data);
      process.stdout.write(ANSI_RESTORE_AND_CLEAR);
      console.log(`[retry attempt ${evt.attempt}] resetting output`);
      console.log();
      process.stdout.write(ANSI_SAVE);
    } else if (item.topic === TOPIC_DELTA) {
      const delta = defaultPayloadConverter.fromPayload<TextDelta>(item.data);
      process.stdout.write(delta.text);
    } else if (item.topic === TOPIC_COMPLETE) {
      // The full text is also in the payload (and returned by the workflow),
      // but the consumer has already rendered it incrementally. Just
      // terminate the line.
      defaultPayloadConverter.fromPayload<TextComplete>(item.data);
      console.log();
      done = true;
      break;
    }
  }

  const result = await handle.result();
  if (!done) console.log();
  console.log(`[workflow result: ${result.length} chars]`);
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
