# OpenTelemetry Interceptors

This sample demonstrates how to configure the Temporal SDK to emit metrics and
tracing spans through an OpenTelemetry collector.

It features the `@temporalio/interceptors-opentelemetry` package, which uses
[Interceptors](https://docs.temporal.io/develop/typescript/interceptors) to
propagate the [OpenTelemetry](https://opentelemetry.io/) tracing context from a
Client to Workflows, to Child Workflows, and up to Activities.

This sample also contains a Docker Compose file that can be used to demonstrate
an OpenTelemetry setup that integrates both Worker metrics and Workflow traces
collection.

## Running the sample

### Preparation

1. Make sure you have a local [Temporal Server](https://github.com/temporalio/cli/#installation) running:

   ```sh
   temporal server start-dev
   ```

2. (Optional) To use the OpenTelemetry collector, run the Docker Compose file:

   ```sh
   docker compose up -d
   ```

3. Install NPM dependencies:

   ```sh
   npm install   # or `pnpm` or `yarn`
   ```

### Output telemetry records to the console

By default, the project is configured to output tracing data to the console.
This is convenient for demonstation purpose.

To run the sample:

1. `npm run start.watch` to start the Worker.
2. In another shell, `npm run workflow` to run the Workflow.

You will observe in your console various telemetry records:

```
{
  resource: { attributes: { 'service.name': 'interceptors-sample' } },
  traceId: '8613431a77bcf95cdfcbbe40f2cdc934',
  id: '15f2ca795e852236'
  parentId: undefined
  name: 'RunWorkflow:example',
  [...]
}
{
  resource: { attributes: { 'service.name': 'interceptors-sample' } },
  traceId: '8613431a77bcf95cdfcbbe40f2cdc934',
  id: '945c3e4ee7ae9b4d'
  parentId: '15f2ca795e852236',
  name: 'StartActivity:greet',
  [...]
}
{
  resource: { attributes: { 'service.name': 'interceptors-sample' } },
  traceId: '8613431a77bcf95cdfcbbe40f2cdc934',
  parentId: "945c3e4ee7ae9b4d"
  id: '056ec5cce08a1796'
  name: 'RunActivity:greet',
  [...]
}
```

The following subsections describe other configurations that you may experiment with.

### Expose native runtime metrics as a Prometheus endpoint

To configure the sample to expose native runtime metrics as Prometheus endpoints:

1. In file `instrumentation.ts`:
   1. In function `setupTraceExporter()`, comment out all blocks;
   2. In function `setupMetricReader()`, uncomment block `(4)`, and comment out all other blocks;
2. In file `worker.ts`:
   1. In function `initializeRuntime()`, uncomment block `(2)`, and comment out all other blocks;
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

To view metrics:

1. Point a web browser on http://0.0.0.0:9091 to view native runtime metrics.
2. Point a web browser on http://0.0.0.0:9092 to view Node's metrics (there might possibly be none).

### Export telemetry data to an OpenTelemetry collector

To configure the sample to send metrics and tracing data to an OpenTelemetry collector:

1. In file `instrumentation.ts`:
   1. In function `setupTraceExporter()`, uncomment block `(2)`, and comment out all other blocks;
   2. In function `setupMetricReader()`, uncomment block `(2)`, and comment out all other blocks;
2. In file `worker.ts`:
   1. In function `initializeRuntime()`, uncomment block `(1)`, and comment out all other blocks;
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

To view collected traces using Jaeger UI (requires the use of the provided Docker Compose file):

1. Point a web browser on http://0.0.0.0:16686.
2. In the search panel on the left side, under the _Service_ drop down menu, select "interceptors-sample",
   then click on "Find Traces".

To view collected traces using Zipkin (requires the use of the provided Docker Compose file)

1. Point a web browser on http://0.0.0.0:9411.
2. In the query bar aat the top, search for `serviceName=interceptors-sample`,
   then click on "Run Query".

To view collected metrics using Prometheus (requires the use of the provided Docker Compose file)

1. Point a web browser on http://0.0.0.0:9090.
2. In the query field, search for `temporal_sticky_cache_size` or similar.
