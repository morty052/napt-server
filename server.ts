import express, { app } from "./lib/express.ts";
import { Talk, SpeechToText } from "./lib/AI.ts";
import { userRoutes, aiRoutes } from "./routes/index.ts";
import { io, httpServer } from "./lib/io.ts";
import cors from "npm:cors@^2.8.5";
import { LobbyEvents } from "./events/lobbyEvents.ts";
import { FormDataReader } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { readAll } from "https://deno.land/std@0.152.0/streams/conversion.ts";
import { CheckReadyPlayers, readyPlayer } from "./lib/sanityclient.ts";
import { matchEvents } from "./events/matchEvents.ts";

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.use("/users", userRoutes);
app.use("/ai", aiRoutes);

const userSpace = io.of("/user");

userSpace.on("connection", (socket) => {
  // ...
  console.log("connected", socket.id);

  socket.on("handshake", (data) => {
    const { username } = data;
    socket.join(`user_${username}`);
    console.log(`user ${username} joined`);
  });

  matchEvents(socket, userSpace);

  LobbyEvents(socket, userSpace);

  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);
  });
});

app.get("/", async (req, res) => {
  console.log("request received");
  res.send("Hello World!");
  const joke = await Talk();
  console.log(joke);
});

httpServer.listen(3000);
