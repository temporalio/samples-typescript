import { ActivitiesService } from '../activities/activities.service';
import { DefaultLogger, LogEntry, Runtime, Worker } from '@temporalio/worker';
import { taskQueue } from '../temporal/shared';
import { ActivityInterface } from '@temporalio/workflow';

export const counterWorkerProviders = [
  {
    provide: 'COUNTER_WORKER',
    inject: [ActivitiesService],
    useFactory: async (activitiesService: ActivitiesService) => {
      Runtime.install({
        logger: new DefaultLogger('WARN', (entry: LogEntry) =>
          console.log(`[${entry.level}]`, entry.message),
        ),
      });

      const activities = activitiesService as unknown as ActivityInterface;

      const worker = await Worker.create({
        workflowsPath: require.resolve('../temporal/workflows'),
        taskQueue,
        activities,
      });

      worker.run();
      console.log('Started worker!');

      return worker;
    },
  },
];
