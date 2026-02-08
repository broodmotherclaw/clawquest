// Global Type Declarations for TypeScript
// Löst Express Type-Fehler

declare module 'express' {
  import { Request, Response, NextFunction } from 'express';
  export default function();
  export const Router: any;
  export const json: any;
  export const urlencoded: any;
  export const static: any;
  export const query: any;
}

declare module 'cors' {
  import { Request, Response, NextFunction } from 'cors';
  export default function();
}

declare module 'socket.io' {
  import { Server, Socket } from 'socket.io';
  export default function();
  export const Server: any;
  export const Socket: any;
}

declare module 'zod' {
  import { z } from 'zod';
  export const z: z;
}

declare module 'prisma' {
  import { PrismaClient } from '@prisma/client';
  export const Prisma: PrismaClient;
}
