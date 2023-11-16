import OpenAI from "npm:openai";

const OPENAI_API_KEY =
  Deno.env.get("OPENAI_API_KEY") ??
  "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";

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
          "You are a helpful assistant designed to output JSON with two fields one to check if the animal is real with simple output of yes or no and another to describe it if its real.",
      },
      { role: "user", content: animalTocheck },
    ],
  });
  const confirmation = completion.choices[0].message.content;
  return confirmation;
}

export { openai, Talk, confirmAnimal };
