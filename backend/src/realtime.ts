import type { Server as SocketIOServer } from 'socket.io';

type SocketServer = Pick<SocketIOServer, 'to'>;

let socketServer: SocketServer | null = null;

export function setSocketServer(server: SocketServer): void {
  socketServer = server;
}

function emitToChannel(channel: string, event: string, payload: unknown): void {
  if (!socketServer) {
    return;
  }

  socketServer.to(channel).emit(event, payload);
}

export function emitHexUpdate(event: string, payload: unknown): void {
  emitToChannel('hex-updates', event, payload);
}

export function emitWaferUpdate(event: string, payload: unknown): void {
  emitToChannel('wafer-updates', event, payload);
}
