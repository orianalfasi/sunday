import jwt from "jsonwebtoken";
import AppError from "../lib/AppError.js";

export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Missing or invalid Authorization header");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
}
