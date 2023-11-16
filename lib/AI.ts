import OpenAI from "npm:openai";
Deno.env.set(
  "OPENAI_API_KEY",
  "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"
);

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
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
