import { useState } from "react";
import { authApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import useActionStatus from "../lib/useActionStatus.js";

export default function Settings() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    avatar: user?.avatar ?? "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [error, setError] = useState("");
  const saveProfileStatus = useActionStatus();
  const savePasswordStatus = useActionStatus();

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    try {
      await saveProfileStatus.run(async () => {
        const data = await authApi.updateProfile({
          name: profile.name.trim(),
          avatar: profile.avatar.trim() || null,
        });
        setUser(data.user);
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");
    try {
      await savePasswordStatus.run(async () => {
        await authApi.changePassword(passwords);
        setPasswords({ currentPassword: "", newPassword: "" });
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="font-serif text-4xl">Settings</h1>
      {error && <p className="mt-4 text-sm text-red-800">{error}</p>}

      <form onSubmit={saveProfile} className="mt-8 space-y-4">
        <h2 className="font-medium">Profile</h2>
        <label className="block text-sm">
          <span className="text-muted">Name</span>
          <input
            value={profile.name}
            onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Avatar URL</span>
          <input
            value={profile.avatar}
            onChange={(event) => setProfile({ ...profile, avatar: event.target.value })}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <button
          disabled={saveProfileStatus.busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm text-paper disabled:opacity-70"
        >
          {saveProfileStatus.label("Save profile", "Saved", "Saving…")}
        </button>
      </form>

      <form onSubmit={savePassword} className="mt-10 space-y-4">
        <h2 className="font-medium">Password</h2>
        <label className="block text-sm">
          <span className="text-muted">Current password</span>
          <input
            type="password"
            value={passwords.currentPassword}
            onChange={(event) =>
              setPasswords({ ...passwords, currentPassword: event.target.value })
            }
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">New password</span>
          <input
            type="password"
            value={passwords.newPassword}
            onChange={(event) =>
              setPasswords({ ...passwords, newPassword: event.target.value })
            }
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <button
          disabled={savePasswordStatus.busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm text-paper disabled:opacity-70"
        >
          {savePasswordStatus.label("Update password", "Updated", "Updating…")}
        </button>
      </form>
    </div>
  );
}
