import express from "express";
import cors from "cors";
import prisma from "./lib/prisma.js";
import errorHandler from "./middleware/ErrorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  const users = await prisma.user.count();
  res.json({ status: "ok", users });
});
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use(errorHandler);

export default app;
