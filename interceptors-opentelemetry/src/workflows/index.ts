import { createActivityHandle, WorkflowInterceptors } from '@temporalio/workflow';
import {
  OpenTelemetryInboundInterceptor,
  OpenTelemetryOutboundInterceptor,
  registerOpentelemetryTracerProvider,
} from '@temporalio/interceptors-opentelemetry/lib/workflow';
import { Example } from '../interfaces';
import type * as activities from '../activities';

const { greet } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

// A workflow that simply calls an activity
export const example: Example = (name: string) => ({
  async execute(): Promise<string> {
    return await greet(name);
  },
});

export const interceptors = (): WorkflowInterceptors => ({
  inbound: [new OpenTelemetryInboundInterceptor()],
  outbound: [new OpenTelemetryOutboundInterceptor()],
});

registerOpentelemetryTracerProvider();
