const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const SECRET = process.env.JWT_SECRET;
const players = {};


// Middleware to check token
io.use((socket, next) => {
  const token = socket.handshake.auth.access_token;
  try {
    console.log(token)
    const user = jwt.verify(token, SECRET);
    console.log(user)
    socket.user = user;
    next();
  } catch (err) {
    console.log(err)
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.userId;
  console.log("User connected:", userId);
  io.emit("playersUpdate", players);

  players[userId] = { x: 650, y: 400, angle: 6 , room: "landing" };

  socket.on("move", (pos) => {
    players[userId] = pos;
  console.log("User Updated:", userId,pos);

    io.emit("playersUpdate", players);
  });

  socket.on("disconnect", () => {
    delete players[userId];
    io.emit("playersUpdate", players);
    console.log("User disconnected:", userId);
  });
});

server.listen(3001, () => console.log("Server listening on port 3001"));
