"use client";

import { useState, type FormEvent } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Signing in…");
    const body = username.trim()
      ? { username: username.trim(), password }
      : { password };
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) { setStatus(result.error ?? "That password is not correct"); return; }
    window.location.assign("/admin");
  }

  return (
    <main className="admin-login">
      <form onSubmit={submit}>
        <a className="brand" href="/"><img src="/brand-logo.jpg" alt="" /><span><b>SDDP</b><small>ADMIN PANEL</small></span></a>
        <h1>Staff sign-in</h1>
        <p>Owner: leave username blank and use the master password. Staff: enter your username and password.</p>
        <label>Username <span style={{ fontWeight: 400, opacity: .6 }}>(leave blank for owner)</span>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="e.g. somchai" />
        </label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        <button type="submit">Open control centre <b>↗</b></button>
        {status ? <small>{status}</small> : null}
      </form>
    </main>
  );
}
