import express from "../lib/express.ts";
import { client } from "../lib/sanityclient.ts";

const userRoutes = express.Router();

userRoutes.get("/", (req, res) => {
  res.send("Hello World!");
});

userRoutes.get("/createuser", async (req, res) => {
  const { email, password } = req.query;
  const doc = {
    _type: "users",
    email,
    password,
  };

  const { _id } = await client.create(doc).then((res) => res);

  res.send({
    _id,
  });
});

export default userRoutes;
