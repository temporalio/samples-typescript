import http from 'http';
import { nanoid } from 'nanoid';
import { Hub, hubInstance } from './hub';

// handleEvents adds the incoming conection as a client in the Hub
function handleEvents(hub: Hub, req: http.IncomingMessage, res: http.ServerResponse) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  res.writeHead(200, headers);

  const clientId = nanoid();
  hub.addClient({
    id: clientId,
    res,
  });

  req.on('close', () => {
    hub.removeClient(clientId);
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

export const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url?.includes('/events')) {
    handleEvents(hubInstance, req, res);
    return;
  }

  handleHealth(req, res);
});
