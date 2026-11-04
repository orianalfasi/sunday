import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, boardApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const result = await authApi.login(form);
      await signIn(result);
      const data = await boardApi.list();
      const boards = data.boards ?? data;
      const personal = boards.find((board) => board.type === "PERSONAL") ?? boards[0];
      navigate(personal ? `/app/boards/${personal.id}` : "/app/inbox");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthScreen title="Welcome back" error={error} onSubmit={onSubmit}>
      <Field
        label="Email"
        type="email"
        value={form.email}
        onChange={(email) => setForm({ ...form, email })}
      />
      <Field
        label="Password"
        type="password"
        value={form.password}
        onChange={(password) => setForm({ ...form, password })}
      />
      <button className="mt-2 w-full rounded-full bg-accent py-2.5 text-paper">Log in</button>
      <p className="text-center text-sm text-muted">
        New here? <Link to="/register" className="text-ink underline">Create an account</Link>
      </p>
    </AuthScreen>
  );
}

export function AuthScreen({ title, error, onSubmit, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-paper p-8"
      >
        <Link to="/" className="font-serif text-2xl">
          sunday.
        </Link>
        <h1 className="font-serif text-3xl">{title}</h1>
        {error && <p className="text-sm text-red-800">{error}</p>}
        {children}
      </form>
    </div>
  );
}

export function Field({ label, type = "text", value, onChange }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
      />
    </label>
  );
}
