import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardApi } from "../api.js";
import { initials } from "../lib/format.js";
import useActionStatus from "../lib/useActionStatus.js";

const ROLE_LABEL = {
  OWNER: "Manager",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export default function BoardManage({
  board,
  membership,
  userId,
  onClose,
  onUpdated,
  onBoardsChanged,
}) {
  const navigate = useNavigate();
  const canAdmin = membership && membership.role !== "MEMBER";
  const isOwner = membership?.role === "OWNER";
  const isTeam = board.type === "TEAM";
  const [form, setForm] = useState({
    name: board.name,
    description: board.description ?? "",
  });
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const saveStatus = useActionStatus();
  const inviteStatus = useActionStatus();
  const leaveStatus = useActionStatus();
  const deleteStatus = useActionStatus();
  const [removedIds, setRemovedIds] = useState({});

  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      await saveStatus.run(async () => {
        const data = await boardApi.update(board.id, {
          name: form.name.trim(),
          description: form.description,
        });
        onUpdated(data.board);
        onBoardsChanged?.();
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function invite(event) {
    event.preventDefault();
    setInviteError("");
    try {
      await inviteStatus.run(async () => {
        await boardApi.invite(board.id, email.trim());
        setEmail("");
      });
    } catch (err) {
      setInviteError(err.message);
    }
  }

  async function goHome() {
    const data = await boardApi.list();
    const boards = data.boards ?? [];
    onBoardsChanged?.();
    const personal = boards.find((item) => item.type === "PERSONAL") ?? boards[0];
    navigate(personal ? `/app/boards/${personal.id}` : "/app/inbox");
  }

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-ink/20" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-paper shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <h2 className="font-serif text-2xl">Manage board</h2>
          <button
            onClick={onClose}
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Close
          </button>
        </header>

        <div className="space-y-8 px-6 py-5 text-sm">
          {error && <p className="text-red-800">{error}</p>}

          {canAdmin && (
            <form onSubmit={save} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-lg border border-line px-3 py-2"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-line px-3 py-2"
                />
              </label>
              <button
                disabled={saveStatus.busy}
                className="rounded-lg bg-accent px-3 py-1.5 text-paper disabled:opacity-70"
              >
                {saveStatus.label("Save", "Saved", "Saving…")}
              </button>
            </form>
          )}

          {canAdmin && isTeam && (
            <form onSubmit={invite} className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                Invite
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (inviteError) setInviteError("");
                  }}
                  placeholder="Email"
                  className="flex-1 rounded-lg border border-line px-3 py-2"
                />
                <button
                  disabled={inviteStatus.busy}
                  className="rounded-lg bg-accent px-3 py-1.5 text-paper disabled:opacity-70"
                >
                  {inviteStatus.label("Invite", "Invited", "Inviting…")}
                </button>
              </div>
              {inviteError && <p className="text-red-800">{inviteError}</p>}
            </form>
          )}

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
              Members
            </h3>
            <ul className="space-y-2">
              {board.members?.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] text-paper">
                      {initials(member.user.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{member.user.name}</span>
                      <span className="block text-xs text-muted">
                        {ROLE_LABEL[member.role]}
                      </span>
                    </span>
                  </span>
                  {canAdmin && member.role !== "OWNER" && member.userId !== userId && (
                    <button
                      className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-70"
                      disabled={removedIds[member.id] === "busy"}
                      onClick={async () => {
                        setRemovedIds((prev) => ({ ...prev, [member.id]: "busy" }));
                        try {
                          const data = await boardApi.removeMember(board.id, member.userId);
                          onUpdated(data.board);
                        } catch (err) {
                          setRemovedIds((prev) => ({ ...prev, [member.id]: null }));
                          setError(err.message);
                        }
                      }}
                    >
                      {removedIds[member.id] === "busy" ? "Removing…" : "Remove"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {isTeam && !isOwner && (
            <button
              className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-70"
              disabled={leaveStatus.busy}
              onClick={async () => {
                try {
                  await leaveStatus.run(async () => {
                    await boardApi.leave(board.id);
                    await goHome();
                  });
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              {leaveStatus.label("Leave board", "Left", "Leaving…")}
            </button>
          )}

          {isTeam && isOwner && (
            <button
              className="text-sm text-red-800 underline-offset-4 hover:underline disabled:opacity-70"
              disabled={deleteStatus.busy}
              onClick={async () => {
                if (!window.confirm("Delete this board and all of its tasks?")) return;
                try {
                  await deleteStatus.run(async () => {
                    await boardApi.remove(board.id);
                    await goHome();
                  });
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              {deleteStatus.label("Delete board", "Deleted", "Deleting…")}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
