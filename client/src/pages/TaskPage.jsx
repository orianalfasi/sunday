import { useOutletContext } from "react-router-dom";
import TaskPanel from "../components/TaskPanel.jsx";

export default function TaskPage() {
  const { members, onChanged, onDeleted } = useOutletContext();
  return (
    <TaskPanel members={members} onChanged={onChanged} onDeleted={onDeleted} />
  );
}
