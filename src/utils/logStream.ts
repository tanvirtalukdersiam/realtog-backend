import { Response } from 'express';

// store active SSE connections
const clients: Set<Response> = new Set();

// log stream service
export class LogStream {
  // add client connection
  static addClient(res: Response): void {
    clients.add(res);
    
    // setup headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to log stream' })}\n\n`);
    
    // handle client disconnect
    res.on('close', () => {
      clients.delete(res);
    });
  }
  
  // broadcast log to all connected clients
  static broadcast(log: any): void {
    const message = `data: ${JSON.stringify(log)}\n\n`;
    
    clients.forEach((client) => {
      try {
        client.write(message);
      } catch (error) {
        // remove dead connections
        clients.delete(client);
      }
    });
  }
  
  // get active connections count
  static getClientCount(): number {
    return clients.size;
  }
  
  // remove all clients
  static removeAllClients(): void {
    clients.forEach((client) => {
      try {
        client.end();
      } catch (error) {
        // ignore errors
      }
    });
    clients.clear();
  }
}

