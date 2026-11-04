import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import app from "./app.js";
import { setIo } from "./lib/io.js";
import { configureCloudinary } from "./lib/cloudinary.js";
import { startDueDateJobs } from "./jobs/dueDates.js";
import { getMembership } from "./lib/access.js";

configureCloudinary();

const PORT = process.env.PORT || 4000;
const origin = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin, credentials: true },
});

setIo(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);

  socket.on("board:join", async (boardId) => {
    if (typeof boardId !== "string") return;
    const member = await getMembership(boardId, socket.userId);
    if (member) socket.join(`board:${boardId}`);
  });

  socket.on("board:leave", (boardId) => {
    if (typeof boardId === "string") socket.leave(`board:${boardId}`);
  });
});

startDueDateJobs();

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
