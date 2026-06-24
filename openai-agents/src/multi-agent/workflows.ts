import { Agent } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import z from 'zod';

const WebSearchItem = z.object({
  reason: z.string().describe('Why this search is important to the query.'),
  query: z.string().describe('The search term to use for the web search.'),
});

const WebSearchPlan = z.object({
  searches: z.array(WebSearchItem).describe('The web searches to perform to best answer the query.'),
});

const ReportData = z.object({
  shortSummary: z.string().describe('A short 2-3 sentence summary of the findings.'),
  markdownReport: z.string().describe('The final report in markdown.'),
  followUpQuestions: z.array(z.string()).describe('Suggested topics to research further.'),
});

function plannerAgent() {
  return new Agent({
    name: 'PlannerAgent',
    instructions:
      'You are a helpful research assistant. Given a query, come up with a set of web searches ' +
      'to perform to best answer the query. Output between 5 and 20 terms to query for.',
    outputType: WebSearchPlan,
  });
}

function searchAgent() {
  return new Agent({
    name: 'SearchAgent',
    instructions:
      'You are a research assistant. Given a search term, summarize the web results for that term ' +
      'in 2-3 short paragraphs under 300 words. Capture only the essence; ignore fluff.',
  });
}

function writerAgent() {
  return new Agent({
    name: 'WriterAgent',
    instructions:
      'You are a senior researcher writing a cohesive report for a research query. You are given the ' +
      'original query and summaries from a research assistant. Produce a detailed markdown report that ' +
      'synthesizes the summaries.',
    outputType: ReportData,
  });
}

export async function researchWorkflow(query: string): Promise<string> {
  const runner = new TemporalOpenAIRunner();

  const planResult = await runner.run(plannerAgent(), `Query: ${query}`);
  const plan = planResult.finalOutput;
  if (!plan) {
    return '';
  }

  const summaries = await Promise.all(
    plan.searches.map(async (item) => {
      const result = await runner.run(
        searchAgent(),
        `Search term: ${item.query}\nReason for searching: ${item.reason}`,
      );
      return result.finalOutput ?? '';
    }),
  );

  const writeResult = await runner.run(
    writerAgent(),
    `Original query: ${query}\nSummarized search results: ${JSON.stringify(summaries)}`,
  );
  const report = writeResult.finalOutput;

  return report?.markdownReport ?? '';
}
