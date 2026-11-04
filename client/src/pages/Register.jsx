import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, boardApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthScreen, Field } from "./Login.jsx";

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const result = await authApi.register(form);
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
    <AuthScreen title="Create your space" error={error} onSubmit={onSubmit}>
      <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
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
      <button className="mt-2 w-full rounded-full bg-accent py-2.5 text-paper">Get started</button>
      <p className="text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="text-ink underline">Log in</Link>
      </p>
    </AuthScreen>
  );
}
