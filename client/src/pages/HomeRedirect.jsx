import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { boardApi } from "../api.js";

export default function HomeRedirect() {
  const [to, setTo] = useState(null);

  useEffect(() => {
    boardApi
      .list()
      .then((data) => {
        const boards = data.boards ?? [];
        const personal = boards.find((board) => board.type === "PERSONAL") ?? boards[0];
        setTo(personal ? `/app/boards/${personal.id}` : "/app/inbox");
      })
      .catch(() => setTo("/app/inbox"));
  }, []);

  if (!to) return <p className="p-8 text-sm text-muted">Opening your board…</p>;
  return <Navigate to={to} replace />;
}
