// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Draw pen line
  socket.on("draw-line", (data) => {
    socket.broadcast.emit("draw-line", data);
  });

  // Clear canvas
  socket.on("clear-board", () => {
    console.log("🧹 Clear board triggered");
    socket.broadcast.emit("clear-board");
  });

  // Sync undo/redo/image upload
  socket.on("restore-canvas", (dataUrl) => {
    socket.broadcast.emit("restore-canvas", dataUrl);
  });

  // Optional text + typing features
  socket.on("typing", () => {
    socket.broadcast.emit("show-typing");
  });

  socket.on("send-text", (text) => {
    socket.broadcast.emit("text-update", text);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running at http://localhost:${PORT}`);
});
