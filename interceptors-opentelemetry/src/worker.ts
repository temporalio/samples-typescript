import { DefaultLogger, Worker, Runtime, makeTelemetryFilterString } from '@temporalio/worker';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { OTLPTraceExporter as OTLPTraceExporterGrpc } from '@opentelemetry/exporter-trace-otlp-grpc'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { OTLPTraceExporter as OTLPTraceExporterHttp } from '@opentelemetry/exporter-trace-otlp-http'; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
  OpenTelemetryActivityInboundInterceptor,
  makeWorkflowExporter,
} from '@temporalio/interceptors-opentelemetry/lib/worker';
import * as activities from './activities';

async function main() {
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: 'interceptors-sample-worker',
  });

  // A span exporter that simply output to the console; useful for testing and debugging
  // const exporter = new ConsoleSpanExporter();

  const exporter = new OTLPTraceExporterGrpc({
    url: 'http://127.0.0.1:4317',
    timeoutMillis: 1000, // Default is 10s; only use shorter values for dev/test scenarios
  });

  // const exporter = new OTLPTraceExporterHttp({
  //   url: 'http://127.0.0.1:4318/v1/traces',
  //   timeoutMillis: 1000,
  // });

  const otel = new NodeSDK({ traceExporter: exporter, resource });
  await otel.start();

  // Silence the Worker logs to better see the span output in this sample
  Runtime.install({
    logger: new DefaultLogger('INFO'),
    telemetryOptions: {
      metrics: {
        // Expose workers metrics on a Prometheus '/metrics' endpoint; i.e. just point a browser
        // on http://localhost:9090/metrics to visualize youe worker's metrics.
        // prometheus: { bindAddress: '0.0.0.0:9090' },

        // Export metrics to an OTLP receiver usnig the "OTLP/HTTP" protocol
        otel: { url: 'http://127.0.0.1:4317', metricsExportInterval: '1s' },

        // Note that the "OTLP/HTTP" protocol (i.e. port 4318) is not supported for Runtime's metrics
      },

      logging: { forward: {}, filter: makeTelemetryFilterString({ core: 'INFO', other: 'INFO' }) },
    },
  });

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'interceptors-opentelemetry-example',
    sinks: {
      exporter: makeWorkflowExporter(exporter, resource),
    },
    // Registers opentelemetry interceptors for Workflow and Activity calls
    interceptors: {
      // example contains both workflow and interceptors
      workflowModules: [require.resolve('./workflows')],
      // FIXME: Add OpenTelemetryActivityOutboundInterceptor once 1.11.4 is out
      activity: [(ctx) => ({ inbound: new OpenTelemetryActivityInboundInterceptor(ctx) })],
    },
  });
  try {
    await worker.run();
  } finally {
    await otel.shutdown();
  }
}

main().then(
  () => void process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
