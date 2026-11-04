import { useEffect, useState } from "react";
import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { boardApi } from "../api.js";
import BoardManage from "../components/BoardManage.jsx";
import Kanban from "../components/Kanban.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

export default function Board() {
  const { boardId } = useParams();
  const { reloadBoards } = useOutletContext() ?? {};
  const { user } = useAuth();
  const { joinBoard, leaveBoard, socket, connected } = useSocket();
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [boardData, taskData] = await Promise.all([
      boardApi.get(boardId),
      boardApi.tasks(boardId),
    ]);
    setBoard(boardData.board);
    setTasks(taskData.tasks);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [boardId]);

  useEffect(() => {
    if (!connected) return undefined;
    joinBoard(boardId);
    return () => leaveBoard(boardId);
  }, [boardId, connected, joinBoard, leaveBoard]);

  useEffect(() => {
    if (!socket) return undefined;

    function upsert(task) {
      if (task.boardId && task.boardId !== boardId) return;
      setTasks((prev) => {
        const index = prev.findIndex((item) => item.id === task.id);
        if (index === -1) return [...prev, task];
        const next = [...prev];
        next[index] = task;
        return next;
      });
    }

    function onDeleted({ id }) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }

    socket.on("task:created", upsert);
    socket.on("task:updated", upsert);
    socket.on("task:moved", upsert);
    socket.on("task:deleted", onDeleted);

    return () => {
      socket.off("task:created", upsert);
      socket.off("task:updated", upsert);
      socket.off("task:moved", upsert);
      socket.off("task:deleted", onDeleted);
    };
  }, [socket, boardId]);

  const membership = board?.members?.find((member) => member.userId === user?.id);

  if (error) {
    return <p className="p-8 text-sm text-red-800">{error}</p>;
  }
  if (!board) {
    return <p className="p-8 text-sm text-muted">Loading board…</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h1 className="font-serif text-3xl">{board.name}</h1>
          {board.description && (
            <p className="mt-1 text-sm text-muted">{board.description}</p>
          )}
        </div>
        <button
          onClick={() => setManaging(true)}
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-accent-soft hover:text-accent"
        >
          Manage
        </button>
      </header>
      <Kanban boardId={boardId} tasks={tasks} setTasks={setTasks} />
      {managing && (
        <BoardManage
          board={board}
          membership={membership}
          userId={user?.id}
          onClose={() => setManaging(false)}
          onUpdated={setBoard}
          onBoardsChanged={reloadBoards}
        />
      )}
      <Outlet
        context={{
          members: board.members ?? [],
          onChanged: (task) =>
            setTasks((prev) => prev.map((item) => (item.id === task.id ? task : item))),
          onDeleted: (id) => setTasks((prev) => prev.filter((task) => task.id !== id)),
        }}
      />
    </div>
  );
}
