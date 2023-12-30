import http from 'node:http';

type Client = {
  id: string;
  roomId: string;
  res: http.ServerResponse;
};

// class Hub maintains the client connections in memory
// In practice, you could use something like Redis PubSub to work out the pub/sub part
export class Hub {
  constructor(private readonly clients: Map<string, Client> = new Map()) {}

  addClient(client: Client) {
    console.log('adding client', client.id);
    this.clients.set(client.id, client);
  }

  removeClient(id: string) {
    console.log('removing client', id);
    this.clients.delete(id);
  }

  broadcast(data: unknown) {
    console.log(`broadcasting to ${this.clients.size}...`);
    for (const client of this.clients.values()) {
      this.writeToClient(client.id, data);
    }
  }

  send(id: string, data: unknown) {
    console.log(`sending to a single client: ${id}`);
    const successful = this.writeToClient(id, data);
    if (!successful) {
      console.warn(`no client with id ${id} found`);
    }
  }

  private writeToClient(id: string, data: unknown) {
    if (!this.clients.has(id)) {
      return false;
    }
    this.clients.get(id)?.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

export const hubInstance = new Hub(new Map());
