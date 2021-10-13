import { createActivityHandle, WorkflowInterceptors } from '@temporalio/workflow';
import {
  OpenTelemetryInboundInterceptor,
  OpenTelemetryOutboundInterceptor,
  registerOpentelemetryTracerProvider,
} from '@temporalio/interceptors-opentelemetry/lib/workflow';
import type * as activities from './activities';

const { greet } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

// A workflow that simply calls an activity
export async function example(name: string): Promise<string> {
  return await greet(name);
}

export const interceptors = (): WorkflowInterceptors => ({
  inbound: [new OpenTelemetryInboundInterceptor()],
  outbound: [new OpenTelemetryOutboundInterceptor()],
});

registerOpentelemetryTracerProvider();
