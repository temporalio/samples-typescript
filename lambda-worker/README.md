# Lambda Worker

This sample demonstrates how to run a Temporal Worker inside an AWS Lambda function using
the [`@temporalio/lambda-worker`](https://typescript.temporal.io) package. It includes
optional OpenTelemetry instrumentation that exports traces and metrics through AWS Distro
for OpenTelemetry (ADOT).

The sample registers a simple greeting Workflow and Activity, but the pattern applies to
any Workflow/Activity definitions.

The sample includes [`@aws-lambda-powertools/logger`](https://docs.aws.amazon.com/powertools/typescript/latest/features/logger/),
which `@temporalio/lambda-worker` automatically detects and uses to produce structured JSON
logs that CloudWatch Logs can parse natively. If you don't need structured logging, you can
remove the dependency and the SDK will fall back to its default human-readable logger.

> **Note:** `@temporalio/lambda-worker` is not yet published. The `package.json` currently
> references it via a local `file:` path to `../../sdk-node/packages/lambda-worker`.
> TODO: Replace with a versioned dependency (e.g. `^1.15.0`) once the package is published.

## Prerequisites

- A [Temporal Cloud](https://temporal.io/cloud) namespace (or a self-hosted Temporal
  cluster accessible from your Lambda)
- AWS CLI configured with permissions to create Lambda functions, IAM roles, and
  CloudFormation stacks
- mTLS client certificate and key for your Temporal namespace (place as `client.pem` and
  `client.key` in this directory)
- Node.js 22+

## Files

| File                                            | Description                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/index.ts`                                  | Lambda entry point — configures the worker, registers Workflows/Activities, enables OTel, and exports the handler |
| `src/workflows.ts`                              | Sample Workflow that executes a greeting Activity                                                             |
| `src/activities.ts`                             | Sample Activity that returns a greeting string                                                                |
| `src/client.ts`                                 | Helper program to start a Workflow execution from a local machine                                             |
| `src/scripts/build-workflow-bundle.ts`          | Pre-bundles Workflow code with OTel interceptor modules for Lambda cold start performance                     |
| `temporal.toml`                                 | Temporal client connection configuration (update with your namespace)                                         |
| `otel-collector-config.yaml`                    | OpenTelemetry Collector configuration for ADOT (routes metrics to CloudWatch, traces to X-Ray)                |
| `deploy-lambda.sh`                              | Packages and deploys the Lambda function                                                                      |
| `mk-iam-role.sh`                                | Creates the IAM role that allows Temporal Cloud to invoke the Lambda                                          |
| `iam-role-for-temporal-lambda-invoke-test.yaml` | CloudFormation template for the IAM role                                                                      |
| `extra-setup-steps`                             | Additional IAM and Lambda configuration for OpenTelemetry support                                             |

## Setup

### 1. Configure Temporal connection

Edit `temporal.toml` with your Temporal Cloud namespace address and credentials. In production,
we'd recommend reading your credentials from a secret store, but to keep this example simple
the toml file defaults to reading them from keys bundled along with the Lambda code.

### 2. Create the IAM role

This creates the IAM role that Temporal Cloud assumes to invoke your Lambda function:

```bash
./mk-iam-role.sh <stack-name> <external-id> <lambda-arn>
```

The External ID is provided by Temporal Cloud in your namespace's serverless worker
configuration.

### 3. (Optional) Enable OpenTelemetry

The sample calls `applyDefaults(config)` in the handler, which registers Temporal SDK
interceptors for tracing Workflow, Activity, and Nexus calls, and configures the Core SDK
to export metrics via OTLP. To complete the setup, attach two ADOT Lambda layers:

1. **ADOT JavaScript layer** — auto-instruments the handler and exports Node.js-side
   traces to X-Ray. See [this page](https://aws-otel.github.io/docs/getting-started/lambda/lambda-js)
   for the layer ARN for your region.
2. **ADOT Collector layer** (`aws-otel-collector-amd64`) — runs the OTel Collector as a
   Lambda extension, receiving Temporal Core SDK metrics via OTLP and forwarding them to
   CloudWatch/X-Ray. See [this page](https://aws-otel.github.io/docs/getting-started/lambda)
   for the layer ARN.

Update `otel-collector-config.yaml` with your function name and region, then set the
following environment variables on your Lambda:

```
AWS_LAMBDA_EXEC_WRAPPER=/opt/otel-instrument
OPENTELEMETRY_COLLECTOR_CONFIG_URI=/var/task/otel-collector-config.yaml
```

`AWS_LAMBDA_EXEC_WRAPPER` enables the JS layer's auto-instrumentation.
`OPENTELEMETRY_COLLECTOR_CONFIG_URI` points the collector at the custom config that
routes metrics to CloudWatch EMF and traces to X-Ray.

Enable X-Ray active tracing on the Lambda function (required for traces to appear):

```bash
aws lambda update-function-configuration --function-name <function-name> \
  --tracing-config Mode=Active
```

Then run the extra setup to grant the Lambda role the necessary permissions:

```bash
./extra-setup-steps <role-name> <function-name> <region> <account-id>
```

### 4. Deploy the Lambda function

Create a Lambda function in AWS with:

- **Runtime**: Node.js >=20
- **Handler**: `index.handler` (the default)
- **Architecture**: x86_64

It's likely you will need to increase the default memory limit in AWS for your lambda. A minimum of
256MB is recommended.

Then deploy:

```bash
./deploy-lambda.sh <function-name>
```

This compiles TypeScript, pre-bundles Workflow code, packages everything with dependencies,
and uploads to AWS Lambda.

### 5. Start a Workflow

Use the starter program to execute a Workflow on the Lambda worker, using
the same config file the Lambda uses for connecting to the server:

```bash
TEMPORAL_CONFIG_FILE=temporal.toml pnpm workflow
```
