import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-serif text-2xl">sunday.</span>
        <div className="flex gap-3 text-sm">
          {user ? (
            <Link
              to="/app"
              className="rounded-full bg-accent px-4 py-2 text-paper"
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-muted hover:text-ink"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-accent px-4 py-2 text-paper"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">
          Meet sunday
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[1.05] tracking-tight md:text-7xl">
          Make room for what matters.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Keep your tasks organized, plan your days, and work together with
          others - all in one simple space.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/register"
            className="rounded-full bg-accent px-5 py-2.5 text-paper"
          >
            Create an account
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-line px-5 py-2.5"
          >
            Log in
          </Link>
        </div>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            [
              "Boards",
              "Keep everything organized in your own boards or share them with others.",
            ],
            [
              "Tasks",
              "Create tasks, set deadlines, and keep track of your progress.",
            ],
            [
              "Inbox",
              "Stay updated on invites, comments, and activity that matters to you.",
            ],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-line bg-paper p-5"
            >
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
