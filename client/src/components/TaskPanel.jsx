import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { taskApi } from "../api.js";
import { initials, PRIORITY_LABEL, STATUS_LABEL, toDateInput } from "../lib/format.js";
import useActionStatus from "../lib/useActionStatus.js";

export default function TaskPanel({ members = [], onChanged, onDeleted }) {
  const { boardId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const commentStatus = useActionStatus();
  const photoStatus = useActionStatus();
  const deleteStatus = useActionStatus();
  const [removedIds, setRemovedIds] = useState({});

  function close() {
    navigate(`/app/boards/${boardId}`);
  }

  async function load() {
    const data = await taskApi.get(taskId);
    setTask(data.task);
    onChanged?.(data.task);
    return data.task;
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [taskId]);

  async function patch(body) {
    const data = await taskApi.update(taskId, body);
    setTask(data.task);
    onChanged?.(data.task);
  }

  async function removeTask() {
    await deleteStatus.run(async () => {
      await taskApi.remove(taskId);
      onDeleted?.(taskId);
      close();
    });
  }

  if (!task) {
    return (
      <div className="fixed inset-0 z-20 flex justify-end bg-ink/20" onClick={close}>
        <aside className="h-full w-full max-w-lg bg-paper p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-muted">{error || "Loading…"}</p>
        </aside>
      </div>
    );
  }

  const assignedIds = new Set(task.assignees.map((person) => person.id));

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-ink/20" onClick={close}>
      <aside
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-paper shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <input
            value={task.title}
            onChange={(event) => setTask({ ...task, title: event.target.value })}
            onBlur={(event) => patch({ title: event.target.value })}
            className="w-full bg-transparent font-serif text-2xl outline-none"
          />
          <button
            onClick={close}
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Close
          </button>
        </header>

        <div className="space-y-6 px-6 py-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted">Status</span>
              <select
                value={task.status}
                onChange={(event) => patch({ status: event.target.value })}
                className="w-full rounded-lg border border-line bg-paper px-2 py-2"
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted">Priority</span>
              <select
                value={task.priority}
                onChange={(event) => patch({ priority: event.target.value })}
                className="w-full rounded-lg border border-line bg-paper px-2 py-2"
              >
                {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted">Due date</span>
              <input
                type="date"
                value={toDateInput(task.dueDate)}
                onChange={(event) => patch({ dueDate: event.target.value || null })}
                className="w-full rounded-lg border border-line bg-paper px-2 py-2"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-muted">Description</span>
            <textarea
              value={task.description ?? ""}
              onChange={(event) => setTask({ ...task, description: event.target.value })}
              onBlur={(event) => patch({ description: event.target.value })}
              rows={4}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2"
            />
          </label>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
              Assignees
            </h3>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const selected = assignedIds.has(member.user.id);
                return (
                  <button
                    key={member.user.id}
                    type="button"
                    onClick={async () => {
                      const data = selected
                        ? await taskApi.removeAssignee(task.id, member.user.id)
                        : await taskApi.addAssignee(task.id, member.user.id);
                      setTask(data.task);
                      onChanged?.(data.task);
                    }}
                    className={`flex items-center gap-2 rounded-full border px-2 py-1 ${
                      selected
                        ? "border-accent bg-accent-soft"
                        : "border-line hover:border-accent hover:bg-accent-soft"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] text-paper">
                      {initials(member.user.name)}
                    </span>
                    {member.user.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
              Photos
            </h3>
            <ul className="space-y-1">
              {task.attachments.map((file) => (
                <li key={file.id} className="flex items-center justify-between gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    {file.fileName}
                  </a>
                  <button
                    className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-70"
                    disabled={removedIds[file.id] === "busy"}
                    onClick={async () => {
                      setRemovedIds((prev) => ({ ...prev, [file.id]: "busy" }));
                      try {
                        await taskApi.deleteAttachment(file.id);
                        await load();
                      } catch (err) {
                        setRemovedIds((prev) => ({ ...prev, [file.id]: null }));
                        setError(err.message);
                      }
                    }}
                  >
                    {removedIds[file.id] === "busy" ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
            <label className="mt-2 inline-block cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:bg-accent-soft hover:text-accent">
              {photoStatus.label("Choose photo", "Uploaded", "Uploading…")}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    setError("Please choose a photo");
                    event.target.value = "";
                    return;
                  }
                  try {
                    await photoStatus.run(async () => {
                      await taskApi.addAttachment(task.id, file);
                      await load();
                    });
                  } catch (err) {
                    setError(err.message);
                  }
                  event.target.value = "";
                }}
              />
            </label>
            {error && <p className="mt-1 text-xs text-red-800">{error}</p>}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
              Comments
            </h3>
            <ul className="space-y-3">
              {task.comments.map((item) => (
                <li key={item.id}>
                  <p className="text-xs text-muted">
                    {item.author?.name} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
            <form
              className="mt-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!comment.trim()) return;
                try {
                  await commentStatus.run(async () => {
                    await taskApi.addComment(task.id, comment.trim());
                    setComment("");
                    await load();
                  });
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder="Write a comment"
                className="w-full rounded-lg border border-line px-3 py-2"
              />
              <button
                disabled={commentStatus.busy}
                className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-paper disabled:opacity-70"
              >
                {commentStatus.label("Comment", "Commented", "Posting…")}
              </button>
            </form>
          </section>

          <button
            onClick={removeTask}
            disabled={deleteStatus.busy}
            className="text-sm text-red-800 underline-offset-4 hover:underline disabled:opacity-70"
          >
            {deleteStatus.label("Delete task", "Deleted", "Deleting…")}
          </button>
        </div>
      </aside>
    </div>
  );
}
