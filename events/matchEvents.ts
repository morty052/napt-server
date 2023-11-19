import { Socket, Namespace } from "npm:socket.io";
import { CheckReadyPlayers, readyPlayer } from "../lib/sanityclient.ts";

export function matchEvents(socket: Socket, userSpace: Namespace) {
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

  socket.on("END_ROUND", (data) => {
    const { room_id, currentTurn, maxTurns, answers } = data;

    console.info("max turns for this match is", maxTurns);

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
