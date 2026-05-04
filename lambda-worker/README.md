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

## Prerequisites

- A [Temporal Cloud](https://temporal.io/cloud) namespace (or a self-hosted Temporal
  cluster accessible from your Lambda)
- AWS CLI configured with permissions to create Lambda functions, IAM roles, and
  CloudFormation stacks
- mTLS client certificate and key for your Temporal namespace (place as `client.pem` and
  `client.key` in this directory)
- Node.js 22+

## Files

| File                                            | Description                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                  | Lambda entry point — configures the worker, registers Workflows/Activities, enables OTel, and exports the handler |
| `src/workflows.ts`                              | Sample Workflow that executes a greeting Activity                                                                 |
| `src/activities.ts`                             | Sample Activity that returns a greeting string                                                                    |
| `src/client.ts`                                 | Helper program to start a Workflow execution from a local machine                                                 |
| `src/scripts/build-workflow-bundle.ts`          | Pre-bundles Workflow code with OTel interceptor modules for Lambda cold start performance                         |
| `temporal.toml`                                 | Temporal client connection configuration (update with your namespace)                                             |
| `otel-collector-config.yaml`                    | OpenTelemetry Collector configuration for ADOT (routes metrics to CloudWatch, traces to X-Ray)                    |
| `deploy-lambda.sh`                              | Packages and deploys the Lambda function                                                                          |
| `mk-iam-role.sh`                                | Creates the IAM role that allows Temporal Cloud to invoke the Lambda                                              |
| `iam-role-for-temporal-lambda-invoke-test.yaml` | CloudFormation template for the IAM role                                                                          |
| `extra-setup-steps`                             | Additional IAM and Lambda configuration for OpenTelemetry support                                                 |

## Setup

The instructions here are a slimmed down version of the more complete getting started guide which
you can find [here](https://docs.temporal.io/production-deployment/worker-deployments/serverless-workers/aws-lambda).

### 1. Create a lambda function for your TypeScript worker

Use either the AWS web UI or CLI to create a Node.js runtime Lambda function. Ex:

```bash
aws lambda create-function \
  --function-name my-temporal-worker \
  --runtime nodejs22.x \
  --handler lib/index.handler \
  --role arn:aws:iam::<YOUR_ACCOUNT_ID>:role/my-temporal-worker-execution \
  --timeout 600 \
  --memory-size 256
```

### 2. Configure Temporal connection

Edit `temporal.toml` with your Temporal Cloud namespace address and credentials. In production,
we'd recommend reading your credentials from a secret store, but to keep this example simple
the toml file defaults to reading them from keys bundled along with the Lambda code.

### 3. Create the IAM role

This creates the IAM role that Temporal Cloud assumes to invoke your Lambda function:

```bash
./mk-iam-role.sh <stack-name> <external-id> <lambda-arn>
```

The External ID is provided by Temporal Cloud in your namespace's serverless worker
configuration.

### 4. (Optional) Enable OpenTelemetry

If you want traces, metrics, and logs, you'll have to attach the ADOT layer to your Lambda function.
You will need to add the appropriate layer for your runtime and region. See [this page
](https://aws-otel.github.io/docs/getting-started/lambda#getting-started-with-aws-lambda-layers)
for more info. See also the [Temporal docs on adding observability
](https://docs.temporal.io/develop/typescript/workers/serverless-workers/aws-lambda#add-observability)
for additional TypeScript-specific configuration.

Then run the extra setup to grant the Lambda role the necessary permissions:

```bash
./extra-setup-steps <role-name> <function-name> <region> <account-id>
```

Update `otel-collector-config.yaml` with your function name and region as needed.

### 5. Deploy the Lambda function

```bash
./deploy-lambda.sh <function-name>
```

This compiles TypeScript, pre-bundles Workflow code, packages everything with dependencies,
and uploads to AWS Lambda.

### 6. Configure Temporal to be able to invoke your lambda function

Refer to the docs [here](https://docs.temporal.io/production-deployment/worker-deployments/serverless-workers/aws-lambda#create-worker-deployment-version).

### 7. Start a Workflow

Use the starter program to execute a Workflow on the Lambda worker, using
the same config file the Lambda uses for connecting to the server:

```bash
TEMPORAL_CONFIG_FILE=temporal.toml pnpm workflow
```
