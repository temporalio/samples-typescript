# Multi-agent

A coordinator transfers the request to a researcher, which transfers it to a writer.

Start a live Worker with `GEMINI_API_KEY=... npx ts-node src/multi-agent/worker.ts` or a credential-free Worker with `MODEL_PROVIDER=fake npx ts-node src/multi-agent/worker.ts`.

```sh
temporal workflow start --type multiAgent --task-queue google-adk-multi-agent --workflow-id google-adk-multi-agent-1 --input '"durable execution"'
```
