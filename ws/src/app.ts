import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer();
const io = new Server(server, { cors: { origin: "*" } });

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  onlineUsers.set(userId, socket.id); 

  socket.on("joinRoom", ({ chatId }) => {
    socket.join(chatId);
  });

  socket.on("sendMessage", ({ chatId, senderId, message }) => {
    io.to(chatId).emit("receiveMessage", { chatId, senderId, message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

server.listen(5001, () => {
  console.log("WebSocket Server running on port 5001");
});
