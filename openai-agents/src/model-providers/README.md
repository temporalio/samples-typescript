# OpenAI Agents: Custom Model Providers

Shows how to pass a **custom (non-default) `ModelProvider`** to `OpenAIAgentsPlugin`. Any OpenAI
Agents SDK `ModelProvider` can drive the model Activity, so you can point an agent at any
OpenAI-compatible endpoint (a local server such as Ollama, OpenRouter, or another gateway) by
constructing `OpenAIProvider` with a custom `baseURL`.

The provider runs inside the model Activity, never in the Workflow sandbox.

## Run

Start a Temporal dev server:

```bash
temporal server start-dev
```

Point the Worker at your OpenAI-compatible endpoint. For example, a local Ollama server:

```bash
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_API_KEY=ollama        # any non-empty value; most local servers ignore it
export OPENAI_MODEL=llama3.2        # a model your endpoint serves
```

Pull the model and start Ollama:

```bash
ollama pull llama3.2
ollama serve
```

Or an OpenRouter endpoint:

```bash
export OPENAI_BASE_URL=https://openrouter.ai/api/v1
export OPENAI_API_KEY=sk-or-...
export OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct
```

Then start the Worker and run the Workflow (run from the `openai-agents/` root, after `npm install` there):

```bash
npx ts-node src/model-providers/worker.ts
```

```bash
npx ts-node src/model-providers/client.ts "Say hello in one sentence."
```

`OPENAI_MODEL` is forwarded to the run via `runConfig.model` and resolved by your custom provider.

## Test

The tests run fully offline. They inject a `FakeModelProvider` — itself a custom `ModelProvider` —
and assert the agent run is handled by the injected provider, including resolving the requested
model name. This is the same injection point the live custom-provider setup uses.

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/model-providers/mocha/*.test.ts"
```
