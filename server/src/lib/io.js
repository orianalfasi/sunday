let io = null;

export function setIo(instance) {
  io = instance;
}

export function emitBoard(boardId, event, payload) {
  io?.to(`board:${boardId}`).emit(event, payload);
}

export function emitUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}
