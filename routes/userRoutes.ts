import express from "../lib/express.ts";

const userRoutes = express.Router();

userRoutes.get("/", (req, res) => {
  res.send("Hello World!");
});

userRoutes.get("/createuser", (req, res) => {
  const { email, password } = req.query;
  res.send({
    id: "abyhddkg67",
    email,
    password,
  });
});

export default userRoutes;
