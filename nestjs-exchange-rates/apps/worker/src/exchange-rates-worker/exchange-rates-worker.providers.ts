import { ConfigService } from '@nestjs/config';
import { ActivitiesService } from '../activities/activities.service';
import { Worker } from '@temporalio/worker';
import { taskQueue } from '@app/shared';

export const exchangeRatesWorkerProviders = [
  {
    provide: 'EXCHANGE_RATES_WORKER',
    inject: [ActivitiesService, ConfigService],
    useFactory: async (activitiesService: ActivitiesService, configService: ConfigService) => {
      const activities = {
        getExchangeRates: activitiesService.getExchangeRates.bind(activitiesService),
      };

      const workflowOption =
        configService.get<string>('NODE_ENV') === 'production'
          ? {
              workflowBundle: {
                codePath: `${__dirname}/workflow-bundle.js`,
              },
            }
          : { workflowsPath: require.resolve('../temporal/workflows') };

      const worker = await Worker.create({
        taskQueue,
        ...workflowOption,
        activities,
      });

      worker.run();
      console.log('Started worker!');

      return worker;
    },
  },
];
