# Google ADK Agents: Observability

Where an agent's token usage, latency, and call counts come from once `OpenTelemetryPlugin` is composed onto the Worker alongside `GoogleAdkPlugin`, as this sample's `worker.ts` does. Without it, ADK's agent-loop spans are created inside the Workflow sandbox and dropped; the [`@temporalio/google-adk-agents` README](https://github.com/temporalio/sdk-typescript/tree/main/contrib/google-adk-agents#telemetry-and-observability) covers why, and the caveats that come with exporting them.

Everything here is traces. ADK defines no OpenTelemetry metric instruments, so there is no metric stream to scrape — the numbers below are span attributes.

## What the spans carry

`call_llm`, one per model call:

- `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens`. There is no total; add the two, as this sample's Worker does when it prints each call.
- `gen_ai.request.model`.
- Latency is the span's own duration. ADK records no latency attribute, on this span or any other.

`invoke_agent <name>` carries nothing numeric, so a call count means counting `call_llm` spans.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GEMINI_API_KEY):
GEMINI_API_KEY=... npx ts-node src/observability/worker.ts

# In another terminal, run the scenario:
npx ts-node src/observability/client.ts
```

The per-call token, model, and latency lines print in the Worker's terminal.

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/observability/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with `fakeModelProvider`, asserting that ADK's `call_llm` spans reach the span processor carrying their model name and token counts. No `GEMINI_API_KEY` is required.
