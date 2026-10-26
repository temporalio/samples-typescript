# Structured output

This Workflow asks an ADK agent for an incident summary constrained by a schema and validates the result before returning it.

Start a live Worker with `npx ts-node src/structured-output/worker.ts`. Set `GEMINI_API_KEY` first.

For a credential-free local run, start it with `MODEL_PROVIDER=fake npx ts-node src/structured-output/worker.ts`.

Start the Workflow with:

```sh
temporal workflow start --type summarizeIncident --task-queue google-adk-structured-output --workflow-id google-adk-structured-output-1 --input '"The primary database is timing out."'
```
