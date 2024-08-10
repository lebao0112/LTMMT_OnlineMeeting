const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

const nameModal = document.getElementById("name-modal");
const nameInput = document.getElementById("name-input");
const setNameButton = document.getElementById("set-name-button");

let myName;
const peers = {};
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
  path: "/peerjs",
});
const myVideo = document.createElement("video");
myVideo.muted = true;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId, userName) => {
      connectToNewUser(userId, stream);
      appendMessage(`(${userId}) connected`);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
  appendMessage(`${userId} disconnected`);
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  nameModal.style.display = "flex";

  setNameButton.addEventListener("click", () => {
    myName = nameInput.value.trim();
    if (myName) {
      socket.emit("set-name", myName);
      appendMessage(`You joined the room as ${myName}`);
      nameModal.style.display = "none";
    }
  });
});

sendButton.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message) {
    appendMessage(`You: ${message}`);
    socket.emit("send-chat-message", `${myName}: ${message}`);
    messageInput.value = "";
  }
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendButton.click();
  }
});

socket.on("chat-message", (message) => {
  appendMessage(message);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function appendMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  chatBox.append(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}
