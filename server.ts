import express, { app } from "./lib/express.ts";
import { Talk } from "./lib/AI.ts";
import userRoutes from "./routes/userRoutes.ts";
import { io, httpServer } from "./lib/io.ts";

app.use(express.json());

app.use("/users", userRoutes);

const userSpace = io.of("/user");

userSpace.on("connection", (socket) => {
  // ...
  console.log("connected", socket.id);

  socket.on("handshake", (data, cb) => {
    const { message } = data;
    console.log("handshake received from", socket.id);
    cb(`returning ${message} from server`);
  });

  socket.on("SET_TURN", (data, cb) => {
    const { turn } = data;
    console.log("turn request from", socket.id);
    cb(turn);
  });

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

io.on("connection", (socket) => {
  // ...
  console.log("connected", socket.id);
});

httpServer.listen(3000);
