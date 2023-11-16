import express from "./lib/express.ts";
import { createServer } from "node:http";
import { Server } from "npm:socket.io";
import { Talk } from "./lib/AI.ts";
import userRoutes from "./routes/userRoutes.ts";

const app = express();
const httpServer = createServer(app);

app.use(express.json());

app.use("/users", userRoutes);

const io = new Server(httpServer, {
  /* options */
});

const userSpace = io.of("/user");

userSpace.on("connection", (socket) => {
  // ...
  console.log("connected", socket.id);

  userSpace.on("handshake", (data, cb) => {
    const { message } = data;
    console.log("handshake received from", socket.id);
    cb(`returning ${message} from server`);
  });

  userSpace.on("disconnect", () => {
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
