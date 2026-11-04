export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export const STATUS_LABEL = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  COMPLETED: "Done",
};

export const PRIORITY_LABEL = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
