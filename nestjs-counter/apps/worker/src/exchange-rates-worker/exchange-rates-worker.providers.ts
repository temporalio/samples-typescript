import { ActivitiesService } from '../activities/activities.service';
import { DefaultLogger, LogEntry, Runtime, Worker } from '@temporalio/worker';
import { taskQueue } from '@app/shared';

export const exchangeRatesWorkerProviders = [
  {
    provide: 'EXCHANGE_RATES_WORKER',
    inject: [ActivitiesService],
    useFactory: async (activitiesService: ActivitiesService) => {
      Runtime.install({
        logger: new DefaultLogger('WARN', (entry: LogEntry) =>
          console.log(`[${entry.level}]`, entry.message),
        ),
      });

      const activities = {
        getExchangeRates:
          activitiesService.getExchangeRates.bind(activitiesService),
      };

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
