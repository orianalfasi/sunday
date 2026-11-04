import * as inviteService from "../services/inviteService.js";

export async function createInvite(req, res) {
  const invite = await inviteService.createInvite(
    req.userId,
    req.params.boardId,
    req.body.email,
  );
  res.status(201).json({ invite });
}

export async function acceptInvite(req, res) {
  const result = await inviteService.acceptInvite(
    req.userId,
    req.params.inviteId,
  );
  res.json(result);
}

export async function declineInvite(req, res) {
  const result = await inviteService.declineInvite(
    req.userId,
    req.params.inviteId,
  );
  res.json(result);
}
