# OpenAI Agents: Reasoning Content

Extracts a reasoning model's **reasoning content** alongside its final answer. Unlike the other
samples, this one does **not** use `TemporalOpenAIRunner`. An Activity calls the `openai` SDK
directly with a reasoning-capable model and reads the non-standard `reasoning_content` field from
the response; the Workflow runs that Activity and returns both the reasoning and the answer.

Mirrors the Python `openai_agents/reasoning_content` sample.

## Run

Start a Temporal dev server:

```bash
temporal server start-dev
```

The default model is `deepseek-reasoner`, which returns `reasoning_content`. Point the `openai`
client at a compatible endpoint:

```bash
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=deepseek-reasoner
```

Then start the Worker and run the Workflow:

```bash
npm install
npm run start.watch
```

```bash
npm run workflow "What is the square root of 841? Please explain your reasoning."
```

Not every model returns reasoning content; use one that does (such as `deepseek-reasoner`).

## Test

The test runs fully offline by overriding the Activity's `openai` client factory with a stub via
`setReasoningClientFactory`. It asserts the Workflow returns the reasoning and content the stub
provides, and that the prompt and model were forwarded to the client.

```bash
npm test
```
