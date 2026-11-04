import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { boardApi, taskApi } from "../api.js";
import { formatDate, PRIORITY_LABEL, STATUS_LABEL } from "../lib/format.js";

export default function AllTasks() {
  const [boards, setBoards] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    priority: "",
    boardId: "",
    page: 1,
  });

  async function load(next = filters) {
    const data = await taskApi.listAll(next);
    setItems(data.items);
    setTotal(data.total);
  }

  useEffect(() => {
    boardApi.list().then((data) => setBoards(data.boards));
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [filters.status, filters.priority, filters.boardId, filters.page]);

  return (
    <div className="p-8">
      <h1 className="font-serif text-4xl">All tasks</h1>
      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters((prev) => ({ ...prev, page: 1 }));
          load({ ...filters, page: 1 });
        }}
      >
        <input
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          placeholder="Search title"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option value="">Any status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(event) => setFilters({ ...filters, priority: event.target.value, page: 1 })}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option value="">Any priority</option>
          {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filters.boardId}
          onChange={(event) => setFilters({ ...filters, boardId: event.target.value, page: 1 })}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option value="">All boards</option>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-accent px-3 py-2 text-sm text-paper">Search</button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Board</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {items.map((task) => (
              <tr key={task.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link
                    to={`/app/boards/${task.boardId}/tasks/${task.id}`}
                    className="hover:underline"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{task.board?.name}</td>
                <td className="px-4 py-3">{STATUS_LABEL[task.status]}</td>
                <td className="px-4 py-3">{PRIORITY_LABEL[task.priority]}</td>
                <td className="px-4 py-3 text-muted">{formatDate(task.dueDate) || "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{total} tasks</p>
    </div>
  );
}
