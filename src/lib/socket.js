import { io } from "socket.io-client";

export const socket = io("https://real-time-collabaration-b.onrender.com/api", {
  autoConnect: true,
});

const getStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem("user");
  return rawUser ? JSON.parse(rawUser) : null;
};

export const registerSocketUser = (userId) => {
  if (!userId) {
    return;d
  }

  if (socket.connected) {
    socket.emit("register-user", { userId });
    return;
  }

  socket.connect();
};

socket.on("connect", () => {
  console.log("Connected to Socket.IO server");

  const user = getStoredUser();
  if (user?._id) {
    socket.emit("register-user", { userId: user._id });
  }
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.IO server");
});
