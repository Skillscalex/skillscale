declare module "ws" {
  export class WebSocket {
    static readonly OPEN: number;
    readonly OPEN: number;
    readonly readyState: number;
    send(data: string): void;
    on(event: "message", listener: (data: unknown) => void): void;
  }

  export class WebSocketServer {
    constructor(options: { server: unknown });
    on(event: "connection", listener: (socket: WebSocket) => void): void;
  }
}
