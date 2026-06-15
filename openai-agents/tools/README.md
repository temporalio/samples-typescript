# OpenAI Agents: Hosted Tools

Runs OpenAI Agents SDK agents as Temporal Workflows using server-side **hosted tools** from
`@openai/agents-openai`. Each hosted tool executes inside the model provider during the model
Activity, so there is no Activity to back them in your own code.

Scenarios (one Workflow each):

- `web-search` — agent with `webSearchTool()`
- `image-generation` — agent with `imageGenerationTool()`
- `code-interpreter` — agent with `codeInterpreterTool()`

## Run

Start a Temporal dev server:

```bash
temporal server start-dev
```

In one shell, start the Worker (a real `OPENAI_API_KEY` is required for hosted tools to fire):

```bash
export OPENAI_API_KEY=sk-...
npm install
npm run start.watch
```

In another shell, run a scenario:

```bash
npm run workflow web-search
npm run workflow image-generation
npm run workflow code-interpreter
```

Hosted tools only execute against the live OpenAI API. With a real key, the agent calls the tool
server-side and returns the model's answer.

## Test

The tests run fully offline with a `FakeModelProvider`. Because hosted tools run inside the real
model call, the fake provider cannot exercise them; instead each test asserts the Workflow **wires**
the hosted tool into the model request and completes with a scripted response.

```bash
npm test
```
