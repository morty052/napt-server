import express from "../lib/express.ts";
import { Talk, confirmAnimal } from "../lib/AI.ts";

const aiRoutes = express.Router();

aiRoutes.get("/", async (req, res) => {
  const joke = await Talk();
  res.send("the joke" + joke);
});

aiRoutes.get("/checkanimal", async (req, res) => {
  const animal = req.query.animal;
  const check = await confirmAnimal(animal as string);
  res.send(JSON.stringify({ check }));
});

export default aiRoutes;
