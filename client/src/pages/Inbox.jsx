import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { inviteApi, notificationApi } from "../api.js";
import { useSocket } from "../context/SocketContext.jsx";
import useActionStatus from "../lib/useActionStatus.js";

const TYPE_LABEL = {
  INVITE: "Invite",
  DUE_SOON: "Due soon",
  OVERDUE: "Overdue",
  ASSIGNED: "Assigned",
  COMMENT: "Comment",
  PHOTO: "Photo",
};

function notificationTitle(item) {
  return item.title.replace(/^(Overdue|Due soon):\s*/i, "");
}

function notificationType(item) {
  return TYPE_LABEL[item.type] ?? item.type.replaceAll("_", " ");
}

export default function Inbox() {
  const { inboxTick, refreshInbox } = useSocket();
  const { reloadBoards } = useOutletContext() ?? {};
  const [items, setItems] = useState([]);
  const [inviteState, setInviteState] = useState({});
  const [error, setError] = useState("");
  const markAllStatus = useActionStatus();

  async function load() {
    const data = await notificationApi.list();
    setItems(data.notifications);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [inboxTick]);

  async function mark(item) {
    if (!item.read) await notificationApi.read(item.id);
    refreshInbox();
  }

  function statusFor(item) {
    return inviteState[item.id];
  }

  async function respond(item, action) {
    setError("");
    setInviteState((prev) => ({ ...prev, [item.id]: action }));
    try {
      if (action === "accepted") {
        await inviteApi.accept(item.inviteId);
        await reloadBoards?.();
      } else {
        await inviteApi.decline(item.inviteId);
      }
      await mark(item);
    } catch (err) {
      setInviteState((prev) => ({ ...prev, [item.id]: null }));
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl">Inbox</h1>
        <button
          disabled={markAllStatus.busy}
          onClick={async () => {
            await markAllStatus.run(async () => {
              await notificationApi.readAll();
              refreshInbox();
            });
          }}
          className="text-sm text-muted hover:text-ink disabled:opacity-70"
        >
          {markAllStatus.label("Mark all read", "Marked as read")}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-800">{error}</p>}
      <ul className="mt-8 space-y-3">
        {items.map((item) => {
          const status = statusFor(item);
          return (
            <li
              key={item.id}
              onClick={() => mark(item)}
              className={`rounded-2xl border border-line bg-paper p-4 ${
                item.read || status ? "opacity-70" : "cursor-pointer"
              }`}
            >
              <p className="text-xs uppercase tracking-wider text-muted">
                {notificationType(item)}
              </p>
              <h2 className="mt-1 font-medium">{notificationTitle(item)}</h2>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {item.type === "INVITE" && item.inviteId && !status && (
                  <>
                    <button
                      className="rounded-lg bg-accent px-3 py-1.5 text-paper"
                      onClick={(event) => {
                        event.stopPropagation();
                        respond(item, "accepted");
                      }}
                    >
                      Accept
                    </button>
                    <button
                      className="rounded-lg border border-line px-3 py-1.5"
                      onClick={(event) => {
                        event.stopPropagation();
                        respond(item, "declined");
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}
                {status === "accepted" && (
                  <>
                    <span className="rounded-lg bg-accent-soft px-3 py-1.5 text-accent">
                      Accepted
                    </span>
                    {item.boardId && (
                      <Link
                        to={`/app/boards/${item.boardId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg px-3 py-1.5 text-muted hover:text-ink"
                      >
                        View board
                      </Link>
                    )}
                  </>
                )}
                {status === "declined" && (
                  <span className="rounded-lg bg-bg px-3 py-1.5 text-muted">
                    Declined
                  </span>
                )}
                {item.type !== "INVITE" && item.boardId && (
                  <Link
                    to={
                      item.taskId
                        ? `/app/boards/${item.boardId}/tasks/${item.taskId}`
                        : `/app/boards/${item.boardId}`
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      mark(item);
                    }}
                    className="rounded-lg px-3 py-1.5 text-muted hover:text-ink"
                  >
                    Open
                  </Link>
                )}
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="text-sm text-muted">You are all caught up.</li>
        )}
      </ul>
    </div>
  );
}
