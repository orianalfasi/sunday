import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { API_URL, getToken } from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [inboxTick, setInboxTick] = useState(0);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(API_URL || undefined, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("notification:new", () => setInboxTick((n) => n + 1));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinBoard = useCallback((boardId) => {
    socketRef.current?.emit("board:join", boardId);
  }, []);

  const leaveBoard = useCallback((boardId) => {
    socketRef.current?.emit("board:leave", boardId);
  }, []);

  const refreshInbox = useCallback(() => {
    setInboxTick((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      inboxTick,
      joinBoard,
      leaveBoard,
      refreshInbox,
    }),
    [connected, inboxTick, joinBoard, leaveBoard, refreshInbox],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}
