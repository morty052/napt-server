import OpenAI from "npm:openai";

const openai = new OpenAI({
  apiKey: "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",
});

async function Talk() {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Tell me a dad joke" }],
  });
  const joke = completion.choices[0].message.content;
  return joke;
}

export { openai, Talk };
