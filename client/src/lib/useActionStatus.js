import { useEffect, useRef, useState } from "react";

export default function useActionStatus(resetMs = 1800) {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function run(action) {
    setStatus("busy");
    try {
      await action();
      setStatus("done");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), resetMs);
    } catch (err) {
      setStatus("idle");
      throw err;
    }
  }

  function label(idle, done, busy = idle) {
    if (status === "done") return done;
    if (status === "busy") return busy;
    return idle;
  }

  return { status, run, label, busy: status === "busy" };
}
