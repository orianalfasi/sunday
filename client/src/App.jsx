import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AllTasks from "./pages/AllTasks.jsx";
import Board from "./pages/Board.jsx";
import HomeRedirect from "./pages/HomeRedirect.jsx";
import Inbox from "./pages/Inbox.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Settings from "./pages/Settings.jsx";
import TaskPage from "./pages/TaskPage.jsx";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="p-8 text-sm text-muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="p-8 text-sm text-muted">Loading…</p>;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <Guest>
            <Login />
          </Guest>
        }
      />
      <Route
        path="/register"
        element={
          <Guest>
            <Register />
          </Guest>
        }
      />
      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="tasks" element={<AllTasks />} />
        <Route path="settings" element={<Settings />} />
        <Route path="boards/:boardId" element={<Board />}>
          <Route path="tasks/:taskId" element={<TaskPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
