import { Connection, Client } from '@temporalio/client';
import { Client as LangSmithClient } from 'langsmith';
import { LangSmithPlugin } from '@temporalio/langsmith';
import { traceable } from 'langsmith/traceable';
import { nanoid } from 'nanoid';
import { ResearchWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const langsmith = new LangSmithClient();
  const plugin = new LangSmithPlugin({ client: langsmith, addTemporalRuns: true });
  const client = new Client({ connection, plugins: [plugin] });

  const pipeline = traceable(
    async () => {
      return client.workflow.execute(ResearchWorkflow, {
        taskQueue: 'langsmith-agent-pipeline',
        workflowId: 'langsmith-agent-pipeline-' + nanoid(),
        args: ['durable execution'],
      });
    },
    { name: 'research_pipeline' }
  );

  const result = await pipeline();
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
