# OpenAI Agents: Reasoning Content

Extracts a reasoning model's **reasoning summary** alongside its final answer. Unlike the other
samples, this one does **not** use `TemporalOpenAIRunner`. An Activity calls the `openai` SDK
directly using the Responses API with `reasoning: { summary: 'auto' }`, reads the reasoning summary
from the `reasoning` item in the response `output`, and returns it together with the final answer;
the Workflow runs that Activity and returns both.

Note that OpenAI returns a reasoning **summary**, not the model's raw chain-of-thought. The
returned field is named `reasoningContent` to match the sample name.

Mirrors the Python `openai_agents/reasoning_content` sample.

## Prerequisites

Reasoning summaries are only returned to **verified OpenAI organizations**. If your organization is
not verified, the Responses API returns an HTTP 400 with `Your organization must be verified to
generate reasoning summaries`. Verify your organization at
<https://platform.openai.com/settings/organization/general> before running this sample.

## Run

Start a Temporal dev server:

```bash
temporal server start-dev
```

The default model is `gpt-5.5`. Set your OpenAI credentials (override the model with `OPENAI_MODEL`
if you want a different reasoning-capable model):

```bash
export OPENAI_API_KEY=sk-...
```

Then start the Worker and run the Workflow (run from the `openai-agents/` root, after `npm install` there):

```bash
npx ts-node reasoning-content/src/worker.ts
```

```bash
npx ts-node reasoning-content/src/client.ts "What is the square root of 841? Please explain your reasoning."
```

## Test

The test runs fully offline by overriding the Activity's `openai` client factory with a stub via
`setReasoningClientFactory`. It asserts the Workflow returns the reasoning summary and content the
stub provides, and that the prompt and model were forwarded to the client.

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "reasoning-content/src/mocha/*.test.ts"
```
