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

/**
 * Retrieves a room based on its ID.
 *
 * @param {string} _id - The ID of the room.
 * @return {Promise<Object>} The room object.
 */
export async function getRoom(_id: string) {
  const query = `*[_type == "rooms" && _id == "${_id}"]{..., players[]{..., controller -> {..., character -> {...}}}}`;
  const data = await client.fetch(query);
  const room = data[0];

  return room;
}

/**
 * Updates the player status to ready in the specified room.
 *
 * @param {string} room_id - The ID of the room.
 * @param {string} username - The username of the player.
 * @return {Promise<string>} The username of the player.
 */

export async function readyPlayer(room_id: string, username: string) {
  try {
    const room = await getRoom(room_id);

    if (!room) {
      throw "room not found";
    }

    const { players } = room;
    const player = players.find(
      (player: any) => player.controller.username == username
    );

    const updatedPlayers = players.map((player: any) => {
      if (player.controller.username == username) {
        return {
          ...player,
          controller: {
            _type: "reference",
            _ref: player.controller._id,
          },
          status: {
            ...player.status,
            ready: true,
          },
        };
      }

      return {
        ...player,
        controller: {
          _type: "reference",
          _ref: player.controller._id,
        },
      };
    });

    await client
      .patch(room_id)
      .setIfMissing({ players: [] })
      .set({ players: updatedPlayers })
      .commit({ autoGenerateArrayKeys: true });

    console.log("player is now ready >", player.username);

    return player.username;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Checks if all players in a room are ready.
 *
 * @param {string} room_id - The ID of the room to check.
 * @return {boolean} Returns true if all players are ready, false otherwise.
 */
export async function CheckReadyPlayers(room_id: string) {
  try {
    const room = await getRoom(room_id);

    if (!room) {
      throw "room not found";
    }
    const { players } = room;
    const allPlayers = players.length;

    const readyPlayers = players.filter(
      (player: any) => player.status.ready == true
    );

    console.info("these players are Ready", readyPlayers);

    if (readyPlayers.length == allPlayers) {
      console.info("all players are ready");
      return true;
    }

    return false;
  } catch (error) {
    console.error(error);
  }
}
