import { Server, Socket } from 'socket.io';

export interface ServerToClientEvents {
  'call:status': (data: {
    callId: string;
    status: string;
    data?: any;
  }) => void;
  'bulkCall:status': (data: {
    bulkCallId: string;
    status: string;
    data?: any;
  }) => void;
  'analytics:update': (data: any) => void;
}

export interface ClientToServerEvents {
  join: (userId: string) => void;
  leave: (userId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
}

export type CustomServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type CustomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>; 