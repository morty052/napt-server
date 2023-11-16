import { Server } from "npm:socket.io";
import { createServer } from "node:http";
import { app } from "./express.ts";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  /* options */
});
