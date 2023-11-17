import { createClient } from "https://esm.sh/@sanity/client";

export const client = createClient({
  projectId: "hxg3wrvl",
  dataset: "production",
  apiVersion: "2023-11-16",
  useCdn: false,
  token:
    "skeU5u0Y4vsVWOXfkGtNkUE3E50B1lVejMpH6FlohJrK5tDrcPpAzEqvGgGgUxZNs6QlrDEHFJhOvSPGSZneA9AtBpDe34oTJcC1mnYJnFjP8TFp1QLl4l1Bsb75j8auVwZRtQuEkROUaPNXruQUChBXuwTIdAfDmmEFxn367JiMGnIH59Td",
});

export async function getUserAvatar(username: string) {
  const query = `*[_type == "users" && username == "${username}"]`;
  const data = await client.fetch(query);
  const user = data[0];
  const { avatar } = user;

  return avatar;
}

export async function getUser(username: string) {
  const query = `*[_type == "users" && username == "${username}"]`;
  const data = await client.fetch(query);
  const user = data[0];

  return user;
}

export async function getUserPoints(username: string) {
  const query = `*[_type == "users" && username == "${username}"]`;
  const data = await client.fetch(query);
  const user = data[0];

  const { points, highscore } = user;

  return {
    points,
    highscore,
  };
}
