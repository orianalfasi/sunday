export const API_URL = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "sunday_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = "GET", body, isForm } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = res.status;
    throw error;
  }
  return data;
}

export const authApi = {
  register: (body) => api("/api/auth/register", { method: "POST", body }),
  login: (body) => api("/api/auth/login", { method: "POST", body }),
  me: () => api("/api/auth/me"),
  updateProfile: (body) => api("/api/auth/me", { method: "PATCH", body }),
  changePassword: (body) => api("/api/auth/me/password", { method: "POST", body }),
};

export const boardApi = {
  list: () => api("/api/boards"),
  get: (id) => api(`/api/boards/${id}`),
  create: (body) => api("/api/boards", { method: "POST", body }),
  update: (id, body) => api(`/api/boards/${id}`, { method: "PATCH", body }),
  remove: (id) => api(`/api/boards/${id}`, { method: "DELETE" }),
  invite: (boardId, email) =>
    api(`/api/boards/${boardId}/invites`, { method: "POST", body: { email } }),
  removeMember: (boardId, userId) =>
    api(`/api/boards/${boardId}/members/${userId}`, { method: "DELETE" }),
  leave: (boardId) => api(`/api/boards/${boardId}/leave`, { method: "POST" }),
  tasks: (boardId) => api(`/api/boards/${boardId}/tasks`),
  activity: (boardId) => api(`/api/boards/${boardId}/activity`),
  createTask: (boardId, body) =>
    api(`/api/boards/${boardId}/tasks`, { method: "POST", body }),
};

export const taskApi = {
  listAll: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== "" && value != null),
      ),
    ).toString();
    return api(`/api/tasks${query ? `?${query}` : ""}`);
  },
  get: (id) => api(`/api/tasks/${id}`),
  update: (id, body) => api(`/api/tasks/${id}`, { method: "PATCH", body }),
  move: (id, body) => api(`/api/tasks/${id}/move`, { method: "PATCH", body }),
  remove: (id) => api(`/api/tasks/${id}`, { method: "DELETE" }),
  addAssignee: (id, userId) =>
    api(`/api/tasks/${id}/assignees`, { method: "POST", body: { userId } }),
  removeAssignee: (id, userId) =>
    api(`/api/tasks/${id}/assignees/${userId}`, { method: "DELETE" }),
  addComment: (id, body) =>
    api(`/api/tasks/${id}/comments`, { method: "POST", body: { body } }),
  addAttachment: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return api(`/api/tasks/${id}/attachments`, { method: "POST", body: form, isForm: true });
  },
  deleteAttachment: (attachmentId) =>
    api(`/api/tasks/attachments/${attachmentId}`, { method: "DELETE" }),
};

export const inviteApi = {
  accept: (id) => api(`/api/invites/${id}/accept`, { method: "POST" }),
  decline: (id) => api(`/api/invites/${id}/decline`, { method: "POST" }),
};

export const notificationApi = {
  list: () => api("/api/notifications"),
  read: (id) => api(`/api/notifications/${id}/read`, { method: "POST" }),
  readAll: () => api("/api/notifications/read-all", { method: "POST" }),
};
