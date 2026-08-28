# MCP

This stateless MCP sample lets an agent read a sample file. Live mode starts the filesystem MCP server over stdio; offline mode registers an in-memory MCP toolset and needs no network access.

Start a live Worker with `GEMINI_API_KEY=... npx ts-node src/mcp/worker.ts` or a credential-free Worker with `MODEL_PROVIDER=fake npx ts-node src/mcp/worker.ts`.

```sh
temporal workflow start --type filesystemAgent --task-queue google-adk-mcp --workflow-id google-adk-mcp-1 --input '"Read hello.txt."'
```
