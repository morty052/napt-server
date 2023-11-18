import OpenAI, { toFile } from "npm:openai";
import { load } from "https://deno.land/std@0.206.0/dotenv/mod.ts";
import path from "npm:path";
import fs from "node:fs";

export const toFileMap = toFile;

const filepath = path.join("../uploads/test.mp3");

const env = await load();
const OPENAI_API_KEY = env["OPENAI_API_KEY"];

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function Talk() {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Tell me a dad joke" }],
  });
  const joke = completion.choices[0].message.content;
  return joke;
}

export async function SpeechToText() {
  try {
    const textResponse = await openai.audio.transcriptions
      .create({
        file: fs.createReadStream("../uploads/test.mp3"),
        model: "whisper-1",
      })
      .then((res) => res.text);
    return textResponse;
  } catch (error) {
    console.log(error);
  }
}

async function confirmAnimal(animal: string) {
  const animalQuestion = () => {
    return ` is this this a real animal? ${animal}`;
  };

  const animalTocheck = animalQuestion();

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant designed to output JSON with two fields 'isRealAnimal', 'description' 'isRealAnimal' is a boolean and 'description' is a string with a description of the animal.",
      },
      { role: "user", content: animalTocheck },
    ],
  });
  const confirmation = completion.choices[0].message.content;
  return confirmation;
}

export { openai, Talk, confirmAnimal };
