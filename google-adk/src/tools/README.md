# Tools

The agent can call a deterministic Celsius conversion `FunctionTool` in the Workflow and an Activity-backed weather tool for non-deterministic work.

Start a live Worker with `GEMINI_API_KEY=... npx ts-node src/tools/worker.ts` or a credential-free Worker with `MODEL_PROVIDER=fake npx ts-node src/tools/worker.ts`.

```sh
temporal workflow start --type weatherAgent --task-queue google-adk-tools --workflow-id google-adk-tools-1 --input '"What is 17 Celsius in Fahrenheit, and what is the weather in Tokyo?"'
```

The API-key-free test verifies that only `getWeather` schedules a tool Activity.
