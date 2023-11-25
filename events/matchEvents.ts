import { Socket, Namespace } from "npm:socket.io";
import {
  CheckReadyPlayers,
  readyPlayer,
  updatePlayerChoice,
} from "../lib/sanityclient.ts";

export function matchEvents(socket: Socket, userSpace: Namespace) {
  socket.on("PING_ROOM", (data) => {
    const { room_id } = data;
    socket.join(room_id);
    console.log("someone joined room", room_id);
  });

  socket.on("SET_TURN", (data, cb) => {
    const { turn, room_id } = data;
    console.log("turn request from", socket.id);
    cb("returning turn from server", turn);
    userSpace.to(room_id).emit("SWITCH_TURN", {
      turn: turn + 1,
    });
  });

  socket.on("SET_LETTER", (data, cb) => {
    const { letter, room_id } = data;
    cb("returning letter from server", letter);
    userSpace.to(room_id).emit("SWITCH_LETTER", {
      letter: letter,
    });
  });

  socket.on("END_ROUND", async (data, cb) => {
    const { room_id, currentTurn, maxTurns, players, player } = data;

    console.info("player", player.username, "choices", player.choices);

    await updatePlayerChoice(room_id, player.username, player.choices);

    cb("returning message from server");

    // userSpace.to(room_id).emit("ROUND_ENDED", {
    //   message: "round ended",
    //   turn: currentTurn + 1 > maxTurns ? 1 : currentTurn + 1,
    // });
  });

  socket.on("TALLY_ROUND", (data) => {
    const { room_id, currentTurn, maxTurns } = data;

    userSpace.to(room_id).emit("ROUND_ENDED", {
      message: "round ended",
      turn: currentTurn + 1 > maxTurns ? 1 : currentTurn + 1,
    });
  });

  socket.on("READY_PLAYER", async (data) => {
    const { room_id, username } = data;
    console.info(username, "is getting ready");
    await readyPlayer(room_id, username);

    const allPlayersready = await CheckReadyPlayers(room_id);

    if (!allPlayersready) {
      console.info(
        "check complete not all players are ready do something else"
      );
      userSpace.to(room_id).emit("PLAYER_READY", {
        message: "player ready " + username,
        player: username,
      });
      return;
    } else if (allPlayersready) {
      console.info("check complete all players are ready do something");
      userSpace.to(room_id).emit("ALL_PLAYERS_READY", {
        message: "ALL PLAYERS READY",
        player: username,
      });
    }
  });
}
