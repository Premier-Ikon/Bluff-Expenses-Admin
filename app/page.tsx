"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminChrome } from "./components/AdminChrome";
import { Expense, postApi } from "./lib/api";
import { useAuth } from "./lib/AuthProvider";
import { categoryLabel, formatDay, formatMoney, statusLabel } from "./lib/format";

export default function AdminPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("submitted");
  const [person, setPerson] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    user
      .getIdToken()
      .then((token) => postApi<{ expenses: Expense[] }>({ action: "listExpenses" }, token))
      .then((payload) => setExpenses(payload.expenses || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load expenses."));
  }, [user]);

  const people = useMemo(() => {
    const map = new Map<string, { email: string; name: string; pending: number; count: number }>();
    for (const expense of expenses) {
      const current = map.get(expense.email) || { email: expense.email, name: expense.name, pending: 0, count: 0 };
      current.name = expense.name || current.name;
      current.count += 1;
      if (expense.status === "submitted") current.pending += expense.total || 0;
      map.set(expense.email, current);
    }
    return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
  }, [expenses]);

  const pending = expenses.filter((item) => item.status === "submitted").reduce((sum, item) => sum + item.total, 0);
  const reimbursed = expenses.filter((item) => item.status === "reimbursed").reduce((sum, item) => sum + item.total, 0);

  const visible = expenses.filter((expense) => {
    if (status !== "all" && expense.status !== status) return false;
    if (person && expense.email !== person) return false;
    const haystack = `${expense.merchant} ${expense.email} ${expense.name}`.toLowerCase();
    if (query && !haystack.includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <AdminChrome>
      <main className="shell">
        <div className="page-head">
          <div>
            <p className="eyebrow">2026 US Tour</p>
            <h1>Expenses</h1>
          </div>
        </div>

        <section className="stats">
          <div className="stat">
            <strong>{formatMoney(pending)}</strong>
            <span>To reimburse</span>
          </div>
          <div className="stat">
            <strong>{formatMoney(reimbursed)}</strong>
            <span>Reimbursed</span>
          </div>
          <div className="stat">
            <strong>{expenses.length}</strong>
            <span>Receipts</span>
          </div>
          <div className="stat">
            <strong>{people.length}</strong>
            <span>People</span>
          </div>
        </section>

        <section className="people">
          <button className={`person${person === "" ? " is-on" : ""}`} type="button" onClick={() => setPerson("")}>
            <strong>All</strong>
            <span>Everyone</span>
          </button>
          {people.map((entry) => (
            <button
              className={`person${person === entry.email ? " is-on" : ""}`}
              type="button"
              key={entry.email}
              onClick={() => setPerson(entry.email)}
            >
              <strong>{formatMoney(entry.pending)}</strong>
              <span>{entry.name || entry.email}</span>
            </button>
          ))}
        </section>

        <div className="toolbar">
          <div className="filters">
            {[
              ["submitted", "Pending"],
              ["reimbursed", "Reimbursed"],
              ["rejected", "Rejected"],
              ["all", "All"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`filter${status === value ? " is-on" : ""}`}
                type="button"
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="search">
            Search
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Merchant, name, or email" />
          </label>
        </div>

        {error ? <p className="notice bad">{error}</p> : null}
        {!visible.length ? <p className="empty">No receipts in this view yet.</p> : null}

        <section className="list">
          {visible.map((expense) => (
            <Link className="row" href={`/expense/${expense.id}`} key={expense.id}>
              <div>
                <h2>{expense.merchant}</h2>
                <p className="meta">
                  {expense.name || expense.email} · {formatDay(expense.purchasedAt)} · {categoryLabel(expense.category)}
                </p>
              </div>
              <div className="row-side">
                <div className="amount">{formatMoney(expense.total, expense.currency)}</div>
                <span
                  className={`pill${expense.status === "reimbursed" ? " is-ok" : ""}${
                    expense.status === "rejected" ? " is-bad" : ""
                  }`}
                >
                  {statusLabel(expense.status)}
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </AdminChrome>
  );
}
