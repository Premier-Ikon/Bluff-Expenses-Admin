"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminChrome } from "../../components/AdminChrome";
import { Expense, postApi } from "../../lib/api";
import { useAuth } from "../../lib/AuthProvider";
import { categoryLabel, formatDay, formatMoney, statusLabel } from "../../lib/format";

export default function AdminExpensePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user || !params.id) return;
    const token = await user.getIdToken();
    const payload = await postApi<{ expense: Expense }>({ action: "getExpense", id: params.id, includeImage: true }, token);
    setExpense(payload.expense);
    setNote(payload.expense.adminNote || "");
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Could not open that receipt."));
  }, [user, params.id]);

  async function setStatus(status: string) {
    if (!user || !expense) return;
    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const payload = await postApi<{ expense: Expense }>(
        { action: "updateExpenseStatus", id: expense.id, status, adminNote: note },
        token
      );
      setExpense({ ...payload.expense, imageDataUrl: expense.imageDataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that receipt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminChrome>
      <main className="shell">
        <Link className="back" href="/">
          <span className="chevron" aria-hidden>
            ←
          </span>
          All expenses
        </Link>
        {error ? <p className="notice bad" style={{ marginTop: 16 }}>{error}</p> : null}
        {!expense && !error ? <p className="muted" style={{ marginTop: 16 }}>Loading receipt…</p> : null}
        {expense ? (
          <div className="detail">
            <div className="detail-top">
              <div>
                <p className="eyebrow">{expense.name || expense.email}</p>
                <h1>{expense.merchant}</h1>
                <p className="meta" style={{ marginTop: 8 }}>
                  {expense.email} · {formatDay(expense.purchasedAt)} · {categoryLabel(expense.category)}
                  {expense.emailSent ? " · Confirmation emailed" : " · Email not sent"}
                </p>
              </div>
              <div className="detail-total">
                <strong>{formatMoney(expense.total, expense.currency)}</strong>
                <span
                  className={`pill${expense.status === "reimbursed" ? " is-ok" : ""}${
                    expense.status === "rejected" ? " is-bad" : ""
                  }`}
                >
                  {statusLabel(expense.status)}
                </span>
              </div>
            </div>

            {expense.imageDataUrl ? (
              <div className="media-box">
                <img className="detail-photo" src={expense.imageDataUrl} alt="Receipt" />
              </div>
            ) : null}

            <div className="stack">
              {expense.items.map((item, index) => (
                <div className="line" key={item.id || index}>
                  <span>
                    {item.name}
                    {item.qty && item.qty !== 1 ? ` × ${item.qty}` : ""}
                  </span>
                  <strong>{formatMoney(item.amount, expense.currency)}</strong>
                </div>
              ))}
              <div className="line">
                <span>Tax</span>
                <span>{formatMoney(expense.tax, expense.currency)}</span>
              </div>
              <div className="line">
                <span>Tip</span>
                <span>{formatMoney(expense.tip, expense.currency)}</span>
              </div>
            </div>

            {expense.notes ? <p>{expense.notes}</p> : null}

            <label>
              Internal note
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note for the team" />
            </label>

            <div className="actions">
              <button className="primary" type="button" disabled={busy} onClick={() => void setStatus("reimbursed")}>
                Mark reimbursed
              </button>
              <button className="danger" type="button" disabled={busy} onClick={() => void setStatus("rejected")}>
                Reject
              </button>
              <button className="ghost" type="button" disabled={busy} onClick={() => void setStatus("submitted")}>
                Mark pending
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </AdminChrome>
  );
}
