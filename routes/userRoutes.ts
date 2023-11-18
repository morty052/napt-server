import express from "../lib/express.ts";
import { client, getUser, getRoom } from "../lib/sanityclient.ts";

const userRoutes = express.Router();

userRoutes.get("/", (req, res) => {
  res.send("Hello World!");
});

userRoutes.get("/createuser", async (req, res) => {
  const { email, password, username } = req.query;
  const doc = {
    _type: "users",
    email,
    password,
    username,
    points: 0,
    highscore: 0,
  };

  const { _id } = await client.create(doc).then((res) => res);

  res.send({
    _id,
    username,
  });
});

userRoutes.get("/getuser", async (req, res) => {
  const { username } = req.query;

  const user = await getUser(username as string);

  res.send({
    user,
  });
});

userRoutes.get("/getroom", async (req, res) => {
  const { room_id } = req.query;
  const room = await getRoom(room_id as string);

  res.send({
    room,
  });
});

export default userRoutes;
