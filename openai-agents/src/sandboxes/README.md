# OpenAI Agents: Sandboxes

Runs an OpenAI Agents SDK `SandboxAgent` as a Temporal Workflow. A sandbox agent gets a shell and a workspace
directory to work in, and the `@temporalio/openai-agents` plugin runs every sandbox operation as an Activity:
creating the sandbox, each command, each file edit, and the teardown. Each operation shows up in Workflow history and
retries like any other Activity.

The Workflow (`src/sandboxes/workflows.ts`) builds a `SandboxAgent` with its default capabilities
and runs it with `temporalSandboxClient('local')` as `runConfig.sandbox.client`. `'local'` names the
`SandboxClientProvider` that the Worker registers and prefixes that provider's Activity names
(`local-sandbox-client-create`, `local-sandbox-session-exec-command`, and so on), so the two names must match.

## Configuration

### The sandbox backend

The Worker (`src/sandboxes/worker.ts`) registers `UnixLocalSandboxClient` under `'local'`. **This backend runs the
agent's commands directly on the Worker host**, as the Worker's OS user, in a temporary workspace directory. It isn't
a container or a chroot, so only run it where you'd be comfortable running the commands yourself. It supports macOS
and Linux. To isolate the agent, register a different backend, such as `DockerSandboxClient`, under the same provider
name. Only the Worker changes.

### The secret

The agent's manifest gives the sandbox a `SERVICE_TOKEN` environment variable. Anything Workflow code passes to an
Activity is recorded in Workflow history, so the manifest doesn't hold the value. It holds
`workerEnvValue('SANDBOX_SERVICE_TOKEN')`, which names a variable in the Worker's environment, and only that name
goes into history. Set `SANDBOX_SERVICE_TOKEN` in the Worker's environment.
The variable must also be listed in the plugin's `resolvableWorkerEnvVars`, or creating the sandbox fails.

Command output goes back to the model through an Activity, so a command that prints the token would put it in history
anyway. The agent's instructions tell it never to print the value.

### Running processes

If a command is still running when `exec_command` returns, the agent gets a session ID for the process. If the Worker
then restarts, the restarted Worker can't reach that process through the session ID. For that reason, the agent's
instructions ask it to run each command to completion in a single `exec_command` call.

## Run

Run these from the `openai-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server, OPENAI_API_KEY, SANDBOX_SERVICE_TOKEN, and macOS or Linux):
export OPENAI_API_KEY=sk-...
export SANDBOX_SERVICE_TOKEN=example-token
npx ts-node src/sandboxes/worker.ts

# In another terminal, start the Workflow:
npx ts-node src/sandboxes/client.ts
```

The agent writes the first 20 Fibonacci numbers to a file in its workspace, reports the line count and the last
number, and confirms that `SERVICE_TOKEN` is set without printing it. In the Web UI at http://localhost:8233, the
model Activities are interleaved with the `local-sandbox-*` Activities that did the sandbox work.

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/sandboxes/mocha/*.test.ts"
```

The tests run a real Worker against `TestWorkflowEnvironment` with a scripted fake model and the Unix-local backend,
so no `OPENAI_API_KEY` is required. They check the sandbox Activities in history, that the token's value never
appears in history, and that a running process can't be reached after a Worker restart. They're skipped on Windows,
which the Unix-local backend doesn't support.
