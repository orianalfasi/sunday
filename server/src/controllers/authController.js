import * as authService from "../services/authService.js";

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}
export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req, res) {
  const user = await authService.getMe(req.userId);
  res.json({ user });
}

export async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.userId, req.body);
  res.json({ user });
}

export async function changePassword(req, res) {
  const result = await authService.changePassword(req.userId, req.body);
  res.json(result);
}
