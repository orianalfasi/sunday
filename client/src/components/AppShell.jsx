import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { boardApi, notificationApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { initials } from "../lib/format.js";
import useActionStatus from "../lib/useActionStatus.js";

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { inboxTick } = useSocket();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [unread, setUnread] = useState(0);
  const [creating, setCreating] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [error, setError] = useState("");
  const createStatus = useActionStatus();

  async function loadBoards() {
    const data = await boardApi.list();
    setBoards(data.boards ?? data);
  }

  async function loadUnread() {
    const data = await notificationApi.list();
    const items = data.notifications ?? data;
    setUnread(items.filter((item) => !item.read).length);
  }

  useEffect(() => {
    loadBoards().catch(() => {});
  }, []);

  useEffect(() => {
    loadUnread().catch(() => {});
  }, [inboxTick]);

  async function createBoard(event) {
    event.preventDefault();
    setError("");
    try {
      await createStatus.run(async () => {
        const data = await boardApi.create({ name: boardName.trim() });
        const board = data.board ?? data;
        setBoardName("");
        await loadBoards();
        setCreating(false);
        navigate(`/app/boards/${board.id}`);
      });
    } catch (err) {
      setError(err.message);
    }
  }

  const personal = boards.filter((board) => board.type === "PERSONAL");
  const team = boards.filter((board) => board.type === "TEAM");

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-ink">
      <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-paper">
        <div className="shrink-0 px-5 py-5">
          <NavLink to="/" className="font-serif text-2xl tracking-tight">
            sunday.
          </NavLink>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4 text-sm">
          <NavLink
            to="/app/inbox"
            className={({ isActive }) =>
              `flex items-center justify-between rounded-lg px-2.5 py-2 ${
                isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-bg"
              }`
            }
          >
            <span>Inbox</span>
            {unread > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[11px] text-paper">
                {unread}
              </span>
            )}
          </NavLink>

          <div>
            <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted">
              Boards
            </p>
            {personal.map((board) => (
              <BoardLink key={board.id} board={board} />
            ))}
            {team.map((board) => (
              <BoardLink key={board.id} board={board} />
            ))}
            {creating ? (
              <form onSubmit={createBoard} className="mt-1 space-y-1.5 px-1">
                <input
                  autoFocus
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Board name"
                  className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-accent"
                />
                {error && <p className="text-xs text-red-800">{error}</p>}
                <div className="flex gap-1">
                  <button
                    disabled={createStatus.busy}
                    className="rounded-md bg-accent px-2 py-1 text-xs text-paper disabled:opacity-70"
                  >
                    {createStatus.label("Create", "Created", "Creating…")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="rounded-md px-2 py-1 text-xs text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="mt-1 w-full rounded-lg px-2.5 py-2 text-left text-muted hover:bg-bg"
              >
                + New board
              </button>
            )}
          </div>

          <NavLink
            to="/app/tasks"
            className={({ isActive }) =>
              `rounded-lg px-2.5 py-2 ${
                isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-bg"
              }`
            }
          >
            All tasks
          </NavLink>
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <NavLink
            to="/app/settings"
            className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-bg"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs text-paper">
              {initials(user?.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm">{user?.name}</span>
              <span className="block truncate text-xs text-muted">{user?.email}</span>
            </span>
          </NavLink>
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-muted hover:bg-bg"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet context={{ reloadBoards: loadBoards }} />
      </main>
    </div>
  );
}

function BoardLink({ board }) {
  return (
    <NavLink
      to={`/app/boards/${board.id}`}
      className={({ isActive }) =>
        `block truncate rounded-lg px-2.5 py-1.5 ${
          isActive ? "bg-accent-soft text-accent" : "text-ink hover:bg-bg"
        }`
      }
    >
      {board.name}
    </NavLink>
  );
}
