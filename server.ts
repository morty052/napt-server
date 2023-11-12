import express from "npm:express";
import { createServer } from "node:http";
import { Server } from "npm:socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

app.get("/", (req, res) => {
  console.log("request received");
  res.send("Hello World!");
});

io.on("connection", (socket) => {
  // ...
  console.log("A user connected", socket.id);
});

httpServer.listen(3000);
