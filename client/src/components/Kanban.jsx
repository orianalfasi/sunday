import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardApi, taskApi } from "../api.js";
import { formatDate, initials, PRIORITY_LABEL } from "../lib/format.js";

const COLUMNS = [
  { id: "OPEN", title: "Open" },
  { id: "IN_PROGRESS", title: "In progress" },
  { id: "COMPLETED", title: "Done" },
];

export default function Kanban({ boardId, tasks, setTasks }) {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState({ OPEN: "", IN_PROGRESS: "", COMPLETED: "" });
  const [creating, setCreating] = useState({});

  const grouped = useMemo(() => {
    const map = { OPEN: [], IN_PROGRESS: [], COMPLETED: [] };
    for (const task of tasks) {
      (map[task.status] ?? map.OPEN).push(task);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks]);

  async function createTask(status) {
    const title = drafts[status].trim();
    if (!title || creating[status]) return;
    setCreating((prev) => ({ ...prev, [status]: true }));
    setDrafts((prev) => ({ ...prev, [status]: "" }));
    try {
      const data = await boardApi.createTask(boardId, { title, status });
      setTasks((prev) => {
        if (prev.some((task) => task.id === data.task.id)) return prev;
        return [...prev, data.task];
      });
    } finally {
      setCreating((prev) => ({ ...prev, [status]: false }));
    }
  }

  async function onDrop(status, event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    if (!taskId) return;
    const column = grouped[status];
    const position = (column.at(-1)?.position ?? 0) + 1;
    const data = await taskApi.move(taskId, { status, position });
    setTasks((prev) => prev.map((task) => (task.id === taskId ? data.task : task)));
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-auto p-6 md:grid-cols-3">
      {COLUMNS.map((column) => (
        <section
          key={column.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDrop(column.id, event)}
          className="flex min-h-[70vh] flex-col rounded-2xl border border-line bg-paper/70"
        >
          <header className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-medium">{column.title}</h2>
            <span className="text-xs text-muted">{grouped[column.id].length}</span>
          </header>
          <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
            {grouped[column.id].map((task) => (
              <article
                key={task.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
                onClick={() => navigate(`/app/boards/${boardId}/tasks/${task.id}`)}
                className="cursor-pointer rounded-xl border border-line bg-paper p-3 shadow-sm transition hover:-translate-y-px hover:shadow"
              >
                <p className="text-sm font-medium leading-snug">{task.title}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      task.priority === "HIGH"
                        ? "bg-red-50 text-red-800"
                        : task.priority === "MEDIUM"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-bg text-muted"
                    }`}
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
                    <div className="flex -space-x-1">
                      {task.assignees?.slice(0, 3).map((person) => (
                        <span
                          key={person.id}
                          title={person.name}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] text-paper"
                        >
                          {initials(person.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                createTask(column.id);
              }}
              className="mt-auto"
            >
              <input
                value={drafts[column.id]}
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [column.id]: event.target.value }))
                }
                placeholder="Add a task"
                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted/70 hover:border-line focus:border-accent"
              />
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}
