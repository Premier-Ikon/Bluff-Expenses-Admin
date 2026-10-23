"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminChrome } from "../components/AdminChrome";
import { BrandSelect } from "../components/BrandSelect";
import { Member, postApi } from "../lib/api";
import { useAuth } from "../lib/AuthProvider";

const ROLE_OPTIONS = [
  { value: "contractor", label: "Contractor" },
  { value: "admin", label: "Admin" },
];

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("contractor");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    const token = await user.getIdToken();
    const payload = await postApi<{ members: Member[] }>({ action: "listMembers" }, token);
    setMembers(payload.members || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Could not load the team."));
  }, [user]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const token = await user.getIdToken();
      const payload = await postApi<{ message?: string }>({ action: "inviteMember", name, email, role }, token);
      setNotice(payload.message || "Invite sent.");
      setName("");
      setEmail("");
      setRole("contractor");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that invite.");
    } finally {
      setBusy(false);
    }
  }

  async function resend(member: Member) {
    if (!user) return;
    setError("");
    setNotice("");
    try {
      const token = await user.getIdToken();
      await postApi({ action: "inviteMember", name: member.name || member.email, email: member.email, role: member.role }, token);
      setNotice(`Password link sent to ${member.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that link.");
    }
  }

  return (
    <AdminChrome>
      <main className="shell">
        <div className="page-head">
          <div>
            <p className="eyebrow">Invite only</p>
            <h1>Team</h1>
          </div>
        </div>

        <p className="lede">
          People on this list get an email from Got Bluff. They create a password from that link, then they can scan
          receipts. dylan@premierikon.com is copied on each receipt confirmation.
        </p>

        <section className="invite-panel">
          <form className="form-grid" onSubmit={invite}>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Role
              <BrandSelect
                ariaLabel="Role"
                value={role}
                options={ROLE_OPTIONS}
                onChange={setRole}
                disabled={busy}
              />
            </label>
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send invite"}
            </button>
          </form>
        </section>

        {notice ? <p className="notice ok">{notice}</p> : null}
        {error ? <p className="notice bad">{error}</p> : null}

        <section className="list team-list">
          {members.map((member) => (
            <div className="row" key={member.email}>
              <div>
                <h2>{member.name || member.email}</h2>
                <p className="meta">
                  {member.email} · {member.role} · {member.status === "active" ? "Active" : "Invite sent"}
                </p>
              </div>
              <button className="ghost" type="button" onClick={() => void resend(member)}>
                {member.status === "active" ? "Send password link" : "Resend invite"}
              </button>
            </div>
          ))}
          {!members.length ? <p className="empty">No team members yet.</p> : null}
        </section>
      </main>
    </AdminChrome>
  );
}
