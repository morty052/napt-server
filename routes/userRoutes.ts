import express from "../lib/express.ts";

const userRoutes = express.Router();

userRoutes.get("/", (req, res) => {
  res.send("Hello World!");
});

export default userRoutes;
