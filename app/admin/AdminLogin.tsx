"use client";

import { useState, type FormEvent } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Signing in…");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setStatus("That password is not correct"); return; }
    window.location.assign("/admin");
  }

  return (
    <main className="admin-login">
      <form onSubmit={submit}>
        <a className="brand" href="/"><img src="/brand-logo.jpg" alt="" /><span><b>SDDP</b><small>ADMIN PANEL</small></span></a>
        <h1>Staff sign-in</h1>
        <p>Use the Render admin password to open the CRM and website editor. Guest pages stay public.</p>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        <button type="submit">Open control centre <b>↗</b></button>
        {status ? <small>{status}</small> : null}
      </form>
    </main>
  );
}
