import * as boardService from "../services/boardService.js";

export async function list(req, res) {
  const boards = await boardService.listBoards(req.userId);
  res.json({ boards });
}
export async function create(req, res) {
  const board = await boardService.createBoard(req.userId, req.body);
  res.status(201).json({ board });
}

export async function getOne(req, res) {
  const board = await boardService.getBoard(req.userId, req.params.boardId);
  res.json({ board });
}

export async function update(req, res) {
  const board = await boardService.updateBoard(
    req.userId,
    req.params.boardId,
    req.body,
  );
  res.json({ board });
}

export async function remove(req, res) {
  const result = await boardService.deleteBoard(req.userId, req.params.boardId);
  res.json(result);
}

export async function removeMember(req, res) {
  const board = await boardService.removeMember(
    req.userId,
    req.params.boardId,
    req.params.userId,
  );
  res.json({ board });
}

export async function leave(req, res) {
  const result = await boardService.leaveBoard(req.userId, req.params.boardId);
  res.json(result);
}
