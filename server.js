const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

const users = {}; // Store user names
const roomUsers = {}; // Store number of users in each room

app.set("view engine", "ejs");
app.use(express.static("public"));

// Redirect to a unique room
app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

// Render the room view
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  let currentRoom;

  socket.on("join-room", (roomId, userId, userName) => {
    if (userName) {
      users[socket.id] = userName; // Save user name
    } else {
      users[socket.id] = "Unknown User"; // Default name if not provided
    }

    currentRoom = roomId;
    socket.join(roomId);

    // Update number of users in room
    if (!roomUsers[roomId]) roomUsers[roomId] = 0;
    roomUsers[roomId] += 1;
    io.to(roomId).emit("update-user-count", roomUsers[roomId]);

    // Broadcast user connection
    socket
      .to(roomId)
      .broadcast.emit("user-connected", userId, users[socket.id]);

    // Handle chat message sending
    socket.on("send-chat-message", (message) => {
      socket.to(roomId).broadcast.emit("chat-message", message);
    });
    // Handle microphone toggle
    socket.on("toggle-mic", (enabled) => {
      socket.to(roomId).broadcast.emit("mic-toggle", socket.id, enabled);
    });

    // Handle camera toggle
    socket.on("toggle-camera", (enabled) => {
      socket.to(roomId).broadcast.emit("camera-toggle", socket.id, enabled);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      roomUsers[roomId] -= 1;
      io.to(roomId).emit("update-user-count", roomUsers[roomId]);
      const userName = users[socket.id];
      socket.to(roomId).broadcast.emit("user-disconnected", userId, userName);
      delete users[socket.id];
    });
  });
});

server.listen(3000);
