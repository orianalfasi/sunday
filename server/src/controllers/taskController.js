import * as taskService from "../services/taskService.js";

export async function listBoardTasks(req, res) {
  const tasks = await taskService.listBoardTasks(req.userId, req.params.boardId);
  res.json({ tasks });
}

export async function listAll(req, res) {
  const result = await taskService.listAllTasks(req.userId, req.query);
  res.json(result);
}

export async function getOne(req, res) {
  const task = await taskService.getTask(req.userId, req.params.taskId);
  res.json({ task });
}

export async function create(req, res) {
  const task = await taskService.createTask(
    req.userId,
    req.params.boardId,
    req.body,
  );
  res.status(201).json({ task });
}

export async function update(req, res) {
  const task = await taskService.updateTask(req.userId, req.params.taskId, req.body);
  res.json({ task });
}

export async function move(req, res) {
  const task = await taskService.moveTask(req.userId, req.params.taskId, req.body);
  res.json({ task });
}

export async function remove(req, res) {
  const result = await taskService.deleteTask(req.userId, req.params.taskId);
  res.json(result);
}

export async function addAssignee(req, res) {
  const task = await taskService.addAssignee(
    req.userId,
    req.params.taskId,
    req.body.userId,
  );
  res.json({ task });
}

export async function removeAssignee(req, res) {
  const task = await taskService.removeAssignee(
    req.userId,
    req.params.taskId,
    req.params.userId,
  );
  res.json({ task });
}

export async function addComment(req, res) {
  const comment = await taskService.addComment(
    req.userId,
    req.params.taskId,
    req.body.body,
  );
  res.status(201).json({ comment });
}

export async function addAttachment(req, res) {
  const attachment = await taskService.addAttachment(
    req.userId,
    req.params.taskId,
    req.file,
  );
  res.status(201).json({ attachment });
}

export async function deleteAttachment(req, res) {
  const result = await taskService.deleteAttachment(
    req.userId,
    req.params.attachmentId,
  );
  res.json(result);
}

export async function listActivity(req, res) {
  const activity = await taskService.listActivity(req.userId, req.params.boardId);
  res.json({ activity });
}
