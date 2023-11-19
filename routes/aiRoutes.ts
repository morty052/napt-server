import express from "../lib/express.ts";
import {
  Talk,
  confirmAnimal,
  confirmName,
  confirmPlace,
  confirmThing,
} from "../lib/AI.ts";
// @deno-types="npm:@types/multer"
import multer from "npm:multer";
import { Readable } from "node:stream";

const aiRoutes = express.Router();

const bufferToStream = (buffer) => {
  return Readable.from(buffer);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Add file extension
    const originalname = file.originalname;
    const extension = originalname.split(".").pop();
    const randomName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, randomName + "." + extension);
  },
});

const upload = multer({ storage: storage });

aiRoutes.get("/", async (req, res) => {
  const joke = await Talk();
  res.send("the joke" + joke);
});

aiRoutes.get("/checkname", async (req, res) => {
  const name = req.query.name;
  const check = await confirmName(name as string);
  res.send(check);
});

aiRoutes.get("/checkanimal", async (req, res) => {
  const animal = req.query.animal;
  const check = await confirmAnimal(animal as string);
  res.send(check);
});

aiRoutes.get("/checkplace", async (req, res) => {
  const place = req.query.place;
  const check = await confirmPlace(place as string);
  res.send(check);
});

aiRoutes.get("/checkthing", async (req, res) => {
  const thing = req.query.thing;
  const check = await confirmThing(thing as string);
  res.send(check);
});

aiRoutes.post("/speechtotext", upload.single("file"), async (req, res) => {
  const { path } = req.file;

  res.send({
    message: req.body,
  });
});

export default aiRoutes;
