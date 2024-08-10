const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const users = {}; // Store user names
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    users[socket.id] = userName; // Store the user's name

    socket
      .to(roomId)
      .broadcast.emit("user-connected", userId, users[socket.id]);

    socket.on("send-chat-message", (message) => {
      socket.to(roomId).broadcast.emit("chat-message", message);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
      delete users[socket.id];
    });
  });
});

server.listen(3000);
