import { Client } from '@temporalio/client';
import { Worker } from '@temporalio/worker';
import { randomUUID } from 'crypto';
import http from 'http';
import { nanoid } from 'nanoid';
import { createActivities } from './activities';
import { Hub } from './hub';
import { chatRoomWorkflow, Event, newEventSignal } from './workflows';

const temporalClient = new Client();
const workerSpecificTaskQueue = randomUUID();
const hub = new Hub();

// handleEvents adds the incoming conection as a client in the Hub
function handleEvents(req: http.IncomingMessage, res: http.ServerResponse) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  res.writeHead(200, headers);

  const qs = new URL(req.url || '', `http://${req.headers.host}`);
  const clientId = qs.searchParams.get('client_id') || nanoid();
  const roomId = qs.searchParams.get('room_id') || 'default';

  hub.addClient({
    id: clientId,
    roomId,
    res,
  });

  req.on('close', () => {
    hub.removeClient(clientId);
  });

  temporalClient.workflow
    .signalWithStart<typeof chatRoomWorkflow, [Event]>(chatRoomWorkflow, {
      args: [
        {
          roomId,
        },
      ],
      signal: newEventSignal,
      signalArgs: [
        {
          type: 'join',
          serverTaskQueue: workerSpecificTaskQueue,
          data: {
            clientId,
          },
        },
      ],
      workflowId: `room:${roomId}`,
      taskQueue: workerSpecificTaskQueue,
    })
    .catch((err) => {
      console.error(err);
      res.end('{"ok": false}');
    });
}

function handlePushEvents(req: http.IncomingMessage, res: http.ServerResponse) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  const qs = new URL(req.url || '', `http://${req.headers.host}`);
  const clientId = qs.searchParams.get('client_id') || nanoid();
  const roomId = qs.searchParams.get('room_id') || 'default';
  const message = qs.searchParams.get('message') || 'hey wtf';

  temporalClient.workflow
    .signalWithStart<typeof chatRoomWorkflow, [Event]>(chatRoomWorkflow, {
      args: [
        {
          roomId,
        },
      ],
      signal: newEventSignal,
      signalArgs: [
        {
          type: 'message',
          serverTaskQueue: workerSpecificTaskQueue,
          data: {
            message,
            clientId,
          },
        },
      ],
      workflowId: `room:${roomId}`,
      taskQueue: workerSpecificTaskQueue,
    })
    .then(() => {
      res.writeHead(200, headers);
      res.end('{"ok": true}');
    })
    .catch(() => {
      res.writeHead(500, headers);
      res.end('{"ok": false}');
    });
}

// handleHealth works as a simple health check
function handleHealth(_req: http.IncomingMessage, res: http.ServerResponse) {
  const headers = {
    'Content-Type': 'application/json',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  res.writeHead(200, headers);

  res.end('{"ok": true}');
}

async function main() {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url?.includes('/events')) {
      handleEvents(req, res);
      return;
    }

    if (req.method === 'POST' && req.url?.includes('/events')) {
      handlePushEvents(req, res);
      return;
    }

    handleHealth(req, res);
  });

  const activities = createActivities(hub);

  // every server will have two components:
  // - an http listener
  // - a temporal worker that is able to broadcast messages to it's own connection list through SSE
  const worker = await Worker.create({
    activities,
    workflowsPath: require.resolve('./workflows'),
    taskQueue: workerSpecificTaskQueue,
  });

  const serverP = new Promise((resolve, reject) => {
    const port = process.env['PORT'] || 3000;
    server.listen(port, () => {
      console.log(`🚀 :: server is listening on port ${port}`);
    });

    server.on('error', reject);
    server.on('close', resolve);
  });

  await Promise.all([worker.run(), serverP]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
