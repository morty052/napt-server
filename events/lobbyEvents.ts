import { client, getUser } from "../lib/sanityclient.ts";

export function LobbyEvents(socket, userNamespace) {
  // TODO:ADD TRY CATCH TO ALL DANGEROUS EVENTS

  socket.on("PING_LOBBY", async (data, cb) => {
    // * DESTRUCTURE CREATED ROOM_ID FROM EVENT DATA
    // ! ROOM_ID IS SAME AS ID OF HOST
    const { room_id } = data;

    try {
      if (!room_id) {
        throw "no room id";
      }

      console.log("this is room id", room_id);
      /*
       * FILTER ROOMS ON BACKEND WITH ROOM_ID FROM EVENT DATA
       * RETREIVE CREATED ROOM
       * GET PLAYERS FROM REFERENCE
       * GET CHARACTERS FROM PLAYERS REFERENCE ON SCHEMA
       */
      const roomQuery = `*[_type == "rooms" && room_id == "${room_id}"]{category, players[]{...,controller -> {..., character -> {...}}}}`;
      const room = await client.fetch(roomQuery).then((res) => res[0]);

      // * DESTRUCTURE  PLAYERS & CATEGORY FROM ROOM OBJECT
      const { players, category } = room;

      // * FILTER PLAYERS TO FIND HOST USING ROOM_ID
      const host = players
        .filter((player) => player.controller._id == room_id)
        .map((player) => ({
          points: player.points,
          username: player.controller.username,
          _id: player.controller._id,
          character: player.controller.character,
          characterAvatar: urlFor(player.controller.character.avatar).url(),
        }));

      /* 
            * MAP THROUGH PLAYERS TO CREATE ARRAY WITH ONLY MEANINGFUL DATA
            * FILTER PLAYERS TO EXCLUDE HOST
              TODO: ADD URL FOR USER IMAGE WHEN MAPPING THROUGH PLAYERS 
            */

      // console.log(host[0].characterAvatar);

      const guests = players
        .map((player) => ({
          points: player.points,
          ready: !player.ready ? false : true,
          username: player.controller.username,
          _id: player.controller._id,
          character: player.controller.character,
          characterAvatar: urlFor(player.controller.character.avatar).url(),
        }))
        .filter((player) => player._id != room_id);

      // * ADD ALL SOCKETS TO THE CURRENT ROOM
      socket.join(`${room_id}`);

      // * CALL FUNCTION TO SET CATEGORY AND PLAYERS IN ROOM
      cb({
        category,
        players: [host[0], ...guests],
      });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("SEND_INVITATION", async (data) => {
    /*
     * get target user socket id from data to send message to specific user clicked
     * username is the username of the host i.e the sender of the invitation gotten from data
     */

    // !ORIGINAL FUNCTION
    // const { _id, username, room_id } = data;

    const { target_user, room_id, sender } = data;
    console.log(target_user);

    try {
      if (!target_user) {
        throw console.log("username not found");
      }

      // * send invitation event to target user
      // ? send target socket id back to target why ?
      userNamespace.to(`user_${target_user}`).emit("INVITATION", {
        username: sender,
        _id: room_id,
        // category,
      });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("SET_CHARACTER", async (data) => {
    const { character, username } = data;
    console.log("this is character", character.name);
    const query = `*[_type == "users" && username == "${username}"]{_id}`;

    try {
      if (!character || !username) {
        throw console.log("Fields missing error");
      }

      const userId = await client.fetch(query).then((res) => res[0]);

      if (!userId) {
        throw console.log("id not found");
      }

      const { _id } = userId;
      await client
        .patch(_id)
        .set({ character: { _type: "reference", _ref: `${character._id}` } })
        .commit({ autoGenerateArrayKeys: true })
        .then((res) => res)
        .catch((err) => console.log(err));
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("SET_CATEGORY", async (data, cb) => {
    const { category, room_id } = data;
    console.table([category, room_id]);

    try {
      if (!category || !room_id) {
        throw console.log("roomid or category not found");
      }
      const roomQuery = `*[_type == "rooms" && room_id == "${room_id}"]{_id}`;
      const roomID = await client.fetch(roomQuery).then((res) => res[0]._id);

      const patchNotice = await client
        .patch(roomID)
        .set({ category: category })
        .commit({ autoGenerateArrayKeys: true })
        .then((res) => res);
      cb(patchNotice);
      userNamespace.to(`${room_id}`).emit("CATEGORY_CHANGE", { category });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("FRIEND_REQUEST", async (data) => {
    const { username, sender } = data;
    console.log("there is a friend request for > ", username);

    const { user: senderName } = await getUser(sender);
    const { user } = await getUser(username);

    console.log(user);
    const { _id } = user;
    const { _id: senderID } = senderName;
    await client
      .patch(_id)
      .setIfMissing({ friendrequests: [] })
      .insert("after", "friendrequests[-1]", [
        { sender: { _type: "reference", _ref: senderID }, accepted: false },
      ])
      .commit({ autoGenerateArrayKeys: true });

    // userNamespace
    //   .to(`user_${username}`)
    //   .emit("FRIEND_REQUEST_RECEIVED", { username: sender });

    userNamespace
      .to(`user_${username}`)
      .emit("NEW_MESSAGE", { sender, accepted: false });

    // TODO: ADD FRIEND REQUEST TO DATABASE
    function addFriendRequest(params) {
      // .......
    }
  });

  socket.on("ACCEPT_FRIEND_REQUEST", async (data) => {
    const { username, sender } = data;
    console.log("accepted request");
    await addFriend(username, sender);

    userNamespace
      .to(`user_${username}`)
      .emit("NEW_MESSAGE", { sender, accepted: false });
  });

  socket.on("FIND_MATCH", async (data, cb) => {
    const { username } = data;
    console.log(username, "is looking for a match");

    //  *   GET PLAYERS LOOKING FOR MATCH
    const query = `*[_type == "users" && matchmaking]`;
    const list = await client.fetch(query).then((res) => res);

    //     * FILTER PLAYER FROM LIST
    const player = list.filter((player) => player.username == username);

    //    * EXCLUDE PLAYER FROM LIST CUT LIST TO 1 AND GET MATCH
    const filter = list.filter((player) => player.username != username);
    const match = filter[0];

    if (!match) {
      console.log("no match found");
      cb({
        message: "NO_MATCH_FOUND",
        match: [],
      });
      return;
    }

    //    * ADD PLAYER AND MATCH TO NEW LIST
    const couple = [player[0], match];

    cb({
      message: "MATCH_FOUND",
      match: match.username,
      seeker_id: player[0]._id,
      match_id: match._id,
    });

    return;
  });

  socket.on("ACCEPT_MATCH", async (data, cb) => {
    const { username, seeker_id, match_id } = data;

    if (!username || !seeker_id || !match_id) {
      console.log("fields  missing");
      return;
    }

    const userQuery = `*[_type == "users" && username == "${username}"]`;
    const user_id = await client.fetch(userQuery).then((res) => res[0]._id);

    if (!user_id) {
      console.log("user not found");
    }
    const roomQuery = `*[_type == "rooms" && references(["${seeker_id}","${match_id}"])]{_id, range, players[]{...,controller -> {..., character -> {...}}}}`;
    const room = await client.fetch(roomQuery).then((res) => res[0]);

    if (!room) {
      console.log("room not found, safe to create");
      // const { start, end } = generateQuestionsIndex();

      const userQuery = `*[_type == "users" && username == "${username}"]`;
      const user_id = await client.fetch(userQuery).then((res) => res[0]._id);

      const challenger = [
        {
          controller: {
            _type: "reference",
            _ref: `${user_id}`,
          },
          points: 0,
          status: {
            connected: true,
            ready: true,
          },
          turn_id: 0,
        },
      ];

      const room = {
        _type: "rooms",
        room_id: "PUBLIC_ROOM",
        players: [...challenger],
      };

      const room_id = await client
        .create(room, { autoGenerateArrayKeys: true })
        .then((res) => res._id);

      socket.join(room_id);
      userNamespace.in(room_id).emit("JOINED_PUBLIC_ROOM", {
        message: `you ${username} created room ${room_id}`,
        status: "CREATED",
        seeker_id,
        match_id,
        room_id,
      });

      return;
    }

    if (room) {
      console.log("room found");

      const { players, _id } = room;

      const userQuery = `*[_type == "users" && username == "${username}"]`;
      const user_id = await client.fetch(userQuery).then((res) => res[0]._id);

      const player = players.find(
        (player) => player.controller.username == username
      );

      if (!player) {
        console.log("this is new player");
      }

      if (player) {
        console.log("room exist with id", _id);
        socket.join(_id);
        userNamespace.in(_id).emit("JOINED_PUBLIC_ROOM", {
          message: `you ${username} are testing namespace`,
          status: "ALREADY_EXISTS",
        });
        return;
      }

      const newplayer = {
        controller: {
          _type: "reference",
          _ref: `${user_id}`,
        },
        points: 0,
        status: {
          connected: true,
          ready: true,
        },
        turn_id: 1,
      };

      const room_id = await client
        .patch(_id)
        .setIfMissing({ players: [] })
        .insert("after", "players[-1]", [newplayer])
        .commit({ autoGenerateArrayKeys: true })
        .then((res) => res._id);

      socket.join(room_id);

      userNamespace.in(room_id).emit("JOINED_PUBLIC_ROOM", {
        message: `you ${username} created room ${room_id}`,
        status: "JOINED",
        seeker_id,
        match_id,
        room_id: _id,
      });
    }
  });

  socket.on("TEST_NAME_SPACE", async (data) => {
    const { room_id, username } = data;
    console.log("tryig test", room_id);

    userNamespace.to(`${room_id}`).emit("PUBLIC_ROOM", {
      message: `you ${username} are testing name space`,
      status: "JOINED",
      room_id,
    });
  });

  socket.on("MATCH_MAKING", async (data, cb) => {
    const { username, room_id: _id } = data;
    console.log(username, "is trying to matchmake");

    const seeker = await getUser(username);
    const { _id: seeker_id } = seeker;

    await client.patch(seeker_id).set({ matchmaking: true }).commit();

    cb("You are now Match making");

    return;
  });

  socket.on("READY_PLAYER", async (data, cb) => {
    const { player, room_id } = data;
    cb("YOU ARE READY");
    const { _id: currentPlayer_id } = player;
    const roomQuery = `*[_type == "rooms" && room_id == "${room_id}"]{_id, category, players[]{...,controller -> {..., character -> {name}}}}`;
    const { players, _id } = await client
      .fetch(roomQuery)
      .then((res) => res[0]);
    const updatedlist = players.map((player) => {
      if (player.controller._id == currentPlayer_id) {
        return {
          controller: { _type: "reference", _ref: `${player.controller._id}` },
          ready: true,
        };
      }

      return {
        controller: { _type: "reference", _ref: `${player.controller._id}` },
        points: player.points,
        ready: player.ready,
      };
    });

    await client
      .patch(_id)
      .setIfMissing({ players: [] })
      .set({ players: updatedlist })
      .commit({ autoGenerateArrayKeys: true })
      .then((res) => console.table(res));
    console.table([players, _id]);
    userNamespace.to(`${room_id}`).emit("PLAYER_READY", "PLAYER IS READY");
  });

  //   socket.on("CREATE_ROOM", async (data, cb) => {
  //     // * DESCTRUCTURE HOST USERNAME AND CATEGORY FROM DATA
  //     const { username, category } = data;
  //     const { start, end } = generateQuestionsIndex();

  //     try {
  //       if (!username || !category) {
  //         throw "Fields missing error";
  //       }

  //       console.log("this is category", category);

  //       // * FIND USER WITH USERNAME EQUAL TO HOST USERNAME
  //       const query = `*[_type == "users" && username == "${username}"]`;
  //       const user = await client.fetch(query).then((res) => res[0]);
  //       const userRef = user._id;

  //       /*
  //        * ASSIGN USER ID TO ROOM ID FOR EASY REFERENCE LATER
  //        * SET ROOM CATEGORY FROM EVENT DATA
  //        */

  //       const room = {
  //         _type: "rooms",
  //         room_id: userRef,
  //         category: category,
  //         range: {
  //           start: start,
  //           end: end,
  //         },
  //       };

  //       // *CREATE ROOM / RERTEIVE CREATED ROOM ID
  //       const res = await client.create(room).then((res) => res._id);

  //       /*
  //        * ADD HOST TO CREATED ROOM
  //        * RETREIVE ROOM_ID TO SEND BACK TO CLIENT SIDE
  //        */

  //       const room_id = await client
  //         .patch(res)
  //         .setIfMissing({ players: [] })
  //         .insert("after", "players[-1]", [
  //           {
  //             controller: {
  //               _type: "reference",
  //               _ref: `${userRef}`,
  //             },
  //             points: 0,
  //             status: {
  //               alive: true,
  //             },
  //             statuseffects: {
  //               none: true,
  //             },
  //           },
  //         ])
  //         .commit({ autoGenerateArrayKeys: true })
  //         .then((res) => res.room_id);

  //       //*MAKE HOST SOCKET JOIN ROOM ID
  //       socket.join(room_id);

  //       // *SEND CREATED ROOM ID BACK TO CLIENT SIDE
  //       cb(room_id);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   });

  // TODO REDUCE AMOUNT OF DATA FETCHED
  socket.on("JOIN_USER", async (data) => {
    const { username, host, _id } = data;

    try {
      if (!username || !host || !_id) {
        console.table([username, host, _id]);
        throw "Fields missing error";
      }

      const hostQuery = `*[_type == "users" && username == "${host}"]`;
      const guestQuery = `*[_type == "users" && username == "${username}"]`;

      const guestRef = await client.fetch(guestQuery).then((res) => res[0]);

      const hostObject = await client.fetch(hostQuery).then((res) => res[0]);
      const host_id = hostObject._id;

      // * GET ROOM TO ADD GUEST ON BACKEND USING HOST ID
      // ? ROOM_ID ALWAYS SAME AS HOST ID
      const roomQuery = `*[_type == "rooms" && room_id == "${host_id}"]`;

      const target_room_id = await client
        .fetch(roomQuery)
        .then((res) => res[0]._id);

      if (!target_room_id) {
        throw console.log("room not found");
      }

      console.log("this is target room id", target_room_id);

      // * GET ROOM TO PATCH USING DESTRUCTURED ID
      await client
        .patch(target_room_id)
        .setIfMissing({ players: [] })
        .insert("after", "players[-1]", [
          {
            controller: {
              _type: "reference",
              _ref: `${guestRef._id}`,
            },
            points: 0,
            status: {
              alive: true,
            },
            statuseffects: {
              none: true,
            },
          },
        ])
        .commit({ autoGenerateArrayKeys: true });

      const categoryQuery = `*[_type == "rooms" && room_id == "${_id}"]{category}`;
      const category = await client
        .fetch(categoryQuery)
        .then((res) => res[0].category);

      console.log("ACCEPTED INVITE FROM", _id);

      /*
             * !SEND EVENT TO GUEST SOCKET
             * DATA BEING SENT BACK TO GUEST IS THE HOST ID 
             * HOST ID IS THE SAME AS ROOM ID TO NAVIGATE TO ON GUEST SIDE
               TODO: ADD MEANINGFUL DATA TO EMIT EVENT
              */
      socket.emit("JOIN_HOST_ROOM", { _id, category });

      // * SEND EVENT TO HOST SOCKET
      userNamespace
        .to(`user_${host}`)
        .emit("INVITATION_ACCEPTED", { guestRef, host_id });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("ADD_GUEST", async (data, cb) => {
    const { room_id, guestRef, guestName } = data;

    // *FIND ROOM

    // * ADD GUEST TO ROOM
    console.log("this is guest ref", guestRef);

    // * ROOMQUERY TO GET  TARGET ROOM USING HOST ID
    // TODO:STREAMLINE QUERY TO INCLUDE MEANINGFUL DATA ONLY
    const roomQuery = `*[_type == "rooms" && room_id == "${room_id}"]{_id, players[]{...,controller -> {..., character -> {name}}}}`;
    const room = await client.fetch(roomQuery).then((res) => res[0]);

    // * DESTRUCTURE ID FROM QUERY RESULT
    const { _id } = room;
    console.log("this is room id", _id);

    // * GET ROOM TO PATCH USING DESTRUCTURED ID
    await client
      .patch(_id)
      .setIfMissing({ players: [] })
      .insert("after", "players[-1]", [
        {
          controller: {
            _type: "reference",
            _ref: `${guestRef}`,
          },
          points: 0,
          status: {
            alive: true,
          },
          statuseffects: {
            none: true,
          },
        },
      ])
      .commit({ autoGenerateArrayKeys: true });

    // * GET GUEST USERNAME FROM PLAYERS IN PATCHED USING GUESTREF FROM EVENT DATA
    // const username = players.find(player => player.controller._id == guestRef).controller.username
    console.log(guestName);

    // * SEND BACK USERNAME TO  HOST AS POPUP
    cb(guestName);
  });

  // ? NAVIGATE TO ROOM ID ASSIGNED BY SANITY ?
  socket.on("LAUNCH_ROOM", async (data, cb) => {
    const { room_id } = data;
    const roomQuery = `*[_type == "rooms" && room_id == "${room_id}"]{_id, category, players[]{...,controller -> {..., character -> {name}}}}`;
    const room = await client.fetch(roomQuery).then((res) => res[0]);

    const { _id: roomID, category, players: list } = room;

    userNamespace.in(room_id).emit("ROOM_READY", {
      room_id,
      category,
    });
    const players = list.map((player) => ({
      socket: player.controller.socket,
    }));

    console.log(players);

    // players.forEach((player) => {
    //   // io.to(`${player.socket}`).emit("ROOM_READY", {
    //   //   room_id,
    //   //   category,
    //   // });
    //   userNamespace.to(`${player.socket}`).emit("ROOM_READY", {
    //     room_id,
    //     category,
    //   });
    // });

    await client
      .patch(roomID)
      .set({ game_started: true })
      .commit({ autoGenerateArrayKeys: true });

    cb({
      room_id,
      category,
      players,
    });
  });
}
