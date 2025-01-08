import { DefaultLogger, Worker, Runtime, makeTelemetryFilterString } from '@temporalio/worker';
import {
  OpenTelemetryActivityInboundInterceptor,
  makeWorkflowExporter,
} from '@temporalio/interceptors-opentelemetry/lib/worker';
import * as activities from './activities';
import {  } from '@opentelemetry/sdk-node';

async function main() {
  // Silence the Worker logs to better see the span output in this sample
  Runtime.install({
    logger: new DefaultLogger('INFO'),
    telemetryOptions: {
      metrics: {
        // Expose workers metrics on a Prometheus '/metrics' endpoint; i.e. just point a browser
        // on http://localhost:9090/metrics to visualize youe worker's metrics.
        // prometheus: { bindAddress: '0.0.0.0:9090' },

        // Export metrics to an OTLP receiver usnig the _OTLP over gRPC_ protocol
        otel: { url: 'http://127.0.0.1:4317', metricsExportInterval: '1s' },

        // Note that the _OTLP over HTTP_ protocol (i.e. port 4318) is not supported for Runtime's metrics
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
  },
);
