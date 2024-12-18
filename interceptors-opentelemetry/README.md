# OpenTelemetry Interceptors

This sample features `@temporalio/interceptors-opentelemetry`, which uses [Interceptors](https://docs.temporal.io/typescript/interceptors)
to add tracing of Workflows and Activities with [opentelemetry](https://opentelemetry.io/).

This sample also contains a Docker Compose file that can be used to demonstrate an OpenTelemetry
setup that integrates both Worker metrics and Workflow traces collection.

### Running this sample

Optionally, to use the OpenTelemetry collector, first run the Docker Compose file:

1. `docker compose up -d`

Then, to run the sample:

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

To view collected metrics using Prometheus (only if the provided Docker Compose file was used):

1. Point a web browser on http://0.0.0.0:9090.
2. In the query field, search for `temporal_sticky_cache_size` or similar.

To view collected traces using Jaeger UI (only if the provided Docker Compose file was used):

1. Point a web browser on http://0.0.0.0:16686.
1. In the search panel on the left side, under the _Service_ drop down menu, select "interceptors-sample-worker",
   then click on "Find Traces".

To view collected traces using Zipkin (only if the provided Docker Compose file was used):

1. Point a web browser on http://0.0.0.0:9411.
1. In the query bar aat the top, search for `serviceName=interceptors-sample-worker`,
   then click on "Run Query".
