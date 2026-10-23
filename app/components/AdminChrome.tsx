"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthProvider";

export function AdminChrome({ children }: { children: ReactNode }) {
  const { loading, ready, user, profile, signIn, logOut, gateError, clearGateError } = useAuth();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    clearGateError();
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="login">
        <div className="login-card" style={{ justifyItems: "center", textAlign: "center" }}>
          <img className="brand-mark" src="/logo.png" alt="Bluff 2026 US Tour" />
          <p className="muted">Loading…</p>
        </div>
      </main>
    );
  }

  if (!ready || !user || !profile) {
    return (
      <main className="login">
        <form className="login-card" onSubmit={onSubmit}>
          <img className="brand-mark" src="/logo.png" alt="Bluff 2026 US Tour" />
          <div className="login-copy">
            <p className="eyebrow">Premier Ikon</p>
            <h1>Expenses</h1>
            <p className="muted">Sign in with the password you created from the tour invite.</p>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error || gateError ? <p className="error">{error || gateError}</p> : null}
          {!ready ? <p className="error">Firebase is not configured for this app yet.</p> : null}
          <button className="primary" type="submit" disabled={busy || !ready}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link className="brand-link" href="/">
            <img src="/logo.png" alt="Bluff 2026 US Tour" />
          </Link>
          <nav className="nav">
            <Link className={pathname === "/" ? "is-on" : ""} href="/">
              Expenses
            </Link>
            <Link className={pathname.startsWith("/team") ? "is-on" : ""} href="/team">
              Team
            </Link>
          </nav>
          <div className="header-meta">
            <span className="header-email">{profile.email}</span>
            <button className="ghost" type="button" onClick={() => void logOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
