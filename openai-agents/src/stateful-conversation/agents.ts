import { Agent, handoff, tool } from '@openai/agents-core';
import type { RunContext } from '@openai/agents-core';
import z from 'zod';

export interface AirlineAgentContext {
  passengerName?: string;
  confirmationNumber?: string;
  seatNumber?: string;
  flightNumber?: string;
}

const faqLookupTool = tool({
  name: 'faqLookupTool',
  description: 'Lookup frequently asked questions.',
  parameters: z.object({ question: z.string() }),
  execute: async ({ question }) => {
    const q = question.toLowerCase();
    if (q.includes('bag') || q.includes('baggage')) {
      return 'You are allowed to bring one bag. It must be under 50 pounds and 22 x 14 x 9 inches.';
    }
    if (q.includes('seat') || q.includes('plane')) {
      return 'There are 120 seats: 22 business and 98 economy. Exit rows are 4 and 16.';
    }
    if (q.includes('wifi')) {
      return 'We have free wifi on the plane; join Airline-Wifi.';
    }
    return "I'm sorry, I don't know the answer to that question.";
  },
});

const updateSeatTool = tool({
  name: 'updateSeat',
  description: 'Update the seat for a given confirmation number.',
  parameters: z.object({
    confirmationNumber: z.string().describe('The confirmation number for the flight.'),
    newSeat: z.string().describe('The new seat to update to.'),
  }),
  execute: async ({ confirmationNumber, newSeat }, runCtx?: RunContext<AirlineAgentContext>) => {
    const ctx = runCtx?.context;
    if (ctx) {
      ctx.confirmationNumber = confirmationNumber;
      ctx.seatNumber = newSeat;
    }
    return `Updated seat to ${newSeat} for confirmation number ${confirmationNumber}`;
  },
});

export function initAgents(): {
  startingAgent: Agent<AirlineAgentContext>;
  agentsByName: Map<string, Agent<AirlineAgentContext>>;
} {
  const faqAgent = new Agent<AirlineAgentContext>({
    name: 'FAQ',
    model: 'gpt-4o-mini',
    handoffDescription: 'A helpful agent that can answer questions about the airline.',
    instructions:
      'You are an FAQ agent. Use the faqLookupTool to answer the question; do not rely on your own ' +
      'knowledge. If you cannot answer, hand off back to the Triage agent.',
    tools: [faqLookupTool],
  });

  const seatBookingAgent = new Agent<AirlineAgentContext>({
    name: 'SeatBooking',
    model: 'gpt-4o-mini',
    handoffDescription: 'A helpful agent that can update a seat on a flight.',
    instructions:
      'You are a seat booking agent. Ask for the confirmation number and desired seat, then use the ' +
      'updateSeat tool. If the question is unrelated, hand off back to the Triage agent.',
    tools: [updateSeatTool],
  });

  const triageAgent = new Agent<AirlineAgentContext>({
    name: 'Triage',
    model: 'gpt-4o-mini',
    handoffDescription: 'A triage agent that delegates a request to the appropriate agent.',
    instructions:
      'You are a triage agent. Delegate FAQ questions to the FAQ agent and seat changes to the ' + 'SeatBooking agent.',
    handoffs: [
      faqAgent,
      handoff(seatBookingAgent, {
        onHandoff: (runCtx: RunContext<AirlineAgentContext>) => {
          runCtx.context.flightNumber = `FLT-${100 + Math.floor(Math.random() * 900)}`;
        },
      }),
    ],
  });

  faqAgent.handoffs.push(triageAgent);
  seatBookingAgent.handoffs.push(triageAgent);

  const agentsByName = new Map<string, Agent<AirlineAgentContext>>([
    [faqAgent.name, faqAgent],
    [seatBookingAgent.name, seatBookingAgent],
    [triageAgent.name, triageAgent],
  ]);

  return { startingAgent: triageAgent, agentsByName };
}
