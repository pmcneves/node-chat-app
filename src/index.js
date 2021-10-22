const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

// client/socket connected
io.on("connection", (socket) => {
  console.log("new websocket connection");

  // query string
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage('Admin', "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage('Admin', `${user.username} has joined!`));
    
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })


    callback();
  });

  // message
  socket.on("sendMessage", (message, callback) => {
    const user  =  getUser(socket.id);

    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  // location
  socket.on("sendLocation", (locationCoords, callback) => {
    const user  =  getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username, 
        `https://google.com/maps?q=${locationCoords.latitude},${locationCoords.longitude}`
      )
    );
    callback();
  });

  // client/socket disconnected
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", generateMessage(user.username, `${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});

server.listen(port, () => {
  console.log("Server running on port " + port);
});

/*
socket.emit-> sends just for the current connection
io.emit-> sends to everyone
broadcast-> sends to everyone but the particular socket (yourself)
io.to.emit => emits event to everyone in a specific room;
socket.broadcast.to.emit => emits event to everyone except socket, in a specific room
*/
