import express, { app } from "./lib/express.ts";
import { Talk, SpeechToText } from "./lib/AI.ts";
import { userRoutes, aiRoutes } from "./routes/index.ts";
import { io, httpServer } from "./lib/io.ts";
import cors from "npm:cors@^2.8.5";
import { LobbyEvents } from "./events/lobbyEvents.ts";
import { FormDataReader } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { readAll } from "https://deno.land/std@0.152.0/streams/conversion.ts";

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

  socket.on("SET_TURN", (data, cb) => {
    const { turn, room_id } = data;
    console.log("turn request from", socket.id);
    cb("returning turn from server", turn);
    userSpace.to(room_id).emit("SWITCH_TURN", {
      turn: turn + 1,
    });
  });

  socket.on("SET_LETTER", (data, cb) => {
    const { letter, room_id } = data;
    cb("returning letter from server", letter);
    userSpace.to(room_id).emit("SWITCH_LETTER", {
      letter: letter,
    });
  });

  socket.on("END_ROUND", (data) => {
    const { room_id, currentTurn, maxTurns } = data;

    console.info("max turns for this match is", maxTurns);

    userSpace.to(room_id).emit("ROUND_ENDED", {
      message: "round ended",
      turn: currentTurn + 1 > maxTurns ? 1 : currentTurn + 1,
    });
  });

  socket.on("SPEAK", async (data: any, cb) => {
    console.log("SPEAK request from", socket.id);
    console.log(recording);
    cb("returning letter from server", data);
  });

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
