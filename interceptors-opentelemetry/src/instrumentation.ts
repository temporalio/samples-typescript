// OpenTelemetry's Node.js documentation recommends to setup instrumentation from a
// dedicated file, which can be required before anything else in the application;
// e.g. by running node with `--require ./instrumentation.js`. See
// https://opentelemetry.io/docs/languages/js/getting-started/nodejs/#setup for details.

/* eslint-disable @typescript-eslint/no-unused-vars */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor, SpanProcessor, SpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter as OTLPTraceExporterGrpc } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPTraceExporter as OTLPTraceExporterHttp } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter as OTLPMetricExporterGrpc } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPMetricExporter as OTLPMetricExporterHttp } from '@opentelemetry/exporter-metrics-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MetricReader, PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Configure the OpenTelemetry trace exporter.
 *
 * IMPORTANT: Uncomment either of the three options below to choose the desired exporter,
 *            as appropriate for your environment.
 */
function setupTraceExporter(): SpanExporter | undefined {
  // (1) A span exporter that simply outputs to the console.
  //     This only makes sense for demonstration purpose.
  //
  return new ConsoleSpanExporter();

  // (2) A span exporter that sends spans to a server using the _OTLP over gRPC_ protocol.
  //     This is the most common configuration when connecting to a trace collector.
  //
  // return new OTLPTraceExporterGrpc({
  //   url: 'http://127.0.0.1:4317',
  //
  //   // Default is 10s, which reduces performance overhead in production,
  //   // but a shorter value is convenient in dev and test use cases.
  //   timeoutMillis: 1000,
  // });

  // (3) A span exporter that sends spans to a server as _OTLP over HTTP_.
  //     This may be used as a fallback if _OTLP over gRPC_ doesn't work for whatever reason.
  //     Note however that _OTLP over HTTP_ is not supported for Runtime's metrics.
  //
  // return new OTLPTraceExporterHttp({
  //   url: 'http://127.0.0.1:4318/v1/traces',
  //
  //   // Default is 10s, which reduces performance overhead in production,
  //   // but a shorter value is convenient in dev and test use cases.
  //   timeoutMillis: 1000,
  // });

  return undefined;
}

/**
 * Configure the OpenTelemetry metric reader, and its associated exporter if applicable.
 *
 * Note this is only pertinent if you want to export metrics from the Node process itself;
 * metrics for the Temporal Worker are controlled through the Runtime options.
 *
 * IMPORTANT: Uncomment either of the four options below to choose the desired exporter,
 *            as appropriate for your environment.
 */
function setupMetricReader(): MetricReader | undefined {
  // (1) A metric reader that periodically outputs all metrics to the console.
  //     This only makes sense for demonstration purpose.
  //
  return new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  });

  // (2) A metric exporter that periodically sends metrics to a server using the _OTLP over gRPC_ protocol.
  //     This is the most common configuration when connecting to a metrics collector.
  //
  // return new PeriodicExportingMetricReader({
  //   exporter: new OTLPMetricExporterGrpc({
  //     url: 'http://127.0.0.1:4317',

  //     // Default is 10s, which reduces performance overhead in production,
  //     // but a shorter value is convenient in dev and test use cases.
  //     timeoutMillis: 1000,
  //   }),
  // });

  // (3) A metrics exporter that sends metrics to a server as _OTLP over HTTP_.
  //     This may be used as a fallback if _OTLP over gRPC_ doesn't work for whatever reason.
  //     Note however that _OTLP over HTTP_ is not supported for Runtime's metrics.
  //
  // return new PeriodicExportingMetricReader({
  //   exporter: new OTLPMetricExporterGrpc({
  //     url: 'http://127.0.0.1:4318/v1/metrics',

  //     // Default is 10s, which reduces performance overhead in production,
  //     // but a shorter value is convenient in dev and test use cases.
  //     timeoutMillis: 1000,
  // });

  // (4) A metrics exporter that exposes metrics as an HTTP endpoint that can be queried by a collector.
  //
  // return new PrometheusExporter({
  //   // Depending on you execution environment, you might need to set `host` to `0.0.0.0` instead;
  //   // beware however that doing so in environments where this is not needed might expose your metrics
  //   // to the public Internet. This is why we default to the safer value of `127.0.0.1`.
  //   host: '127.0.0.1',

  //   // Runtime's metrics will be exposed on port 9091, Node's metrics on 9092.
  //   port: 9092,
  // });
}

export const resource = new Resource({
  [ATTR_SERVICE_NAME]: 'interceptors-sample',
});

const traceExporter = setupTraceExporter();

export const spanProcessor: SpanProcessor | undefined = traceExporter
  ? new SimpleSpanProcessor(traceExporter)
  : undefined;

const metricReader = setupMetricReader();

export function setupOtelSdk(): NodeSDK {
  const otelSdk = new NodeSDK({
    // This is required for use with the `@temporalio/interceptors-opentelemetry` package.
    resource,

    // This is required for use with the `@temporalio/interceptors-opentelemetry` package.
    spanProcessors: spanProcessor ? [spanProcessor] : [],

    // This is optional; it enables collecting metrics about the Node process, and some other libraries.
    // Note that Temporal's Worker metrics are controlled through the Runtime options and do not relate
    // to this option.
    metricReader,

    // This is optional; it enables auto-instrumentation for certain libraries.
    instrumentations: [getNodeAutoInstrumentations()],
  });

  otelSdk.start();
  return otelSdk;
}
