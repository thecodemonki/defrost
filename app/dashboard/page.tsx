"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadHistory,
  clearHistory,
  markAsSent,
  cycleStatus,
  deleteEntry,
  prepToText,
  Generation,
} from "@/lib/history";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_LABELS: Record<string, { label: string; emoji: string }> = {
  sent: { label: "Sent", emoji: "📤" },
  replied: { label: "Replied", emoji: "💬" },
  no_reply: { label: "No reply", emoji: "🕐" },
  meeting_booked: { label: "Meeting booked", emoji: "📅" },
};

type View = "drafts" | "tracker";
type Filter = "all" | "outreach" | "coffee";

export default function Dashboard() {
  const [history, setHistory] = useState<Generation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("drafts");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setHistory(loadHistory()), []);

  function reload() { setHistory(loadHistory()); }

  function copy(g: Generation) {
    const text = g.mode === "coffee" && g.prep ? prepToText(g.prep) : (g.message ?? "");
    navigator.clipboard.writeText(text);
    setCopiedId(g.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleMarkSent(id: string) {
    markAsSent(id);
    reload();
  }

  function handleCycleStatus(id: string) {
    cycleStatus(id);
    reload();
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    reload();
  }

  function handleClearAll() {
    clearHistory();
    reload();
  }

  const total = history.length;
  const sentItems = history.filter((g) => g.sent);
  const repliedCount = sentItems.filter((g) => g.status === "replied" || g.status === "meeting_booked").length;

  const drafts = history.filter((g) => {
    if (filter === "coffee") return g.mode === "coffee";
    if (filter === "outreach") return g.mode !== "coffee";
    return true;
  });

  const tracked = sentItems.filter((g) => {
    if (filter === "coffee") return g.mode === "coffee";
    if (filter === "outreach") return g.mode !== "coffee";
    return true;
  });

  const items = view === "drafts" ? drafts : tracked;

  return (
    <main className="wrap">
      <header className="masthead dash-head">
        <h1 className="dash-h1">Dashboard</h1>
        <p className="lede">
          {view === "drafts"
            ? "Every draft and prep you've generated."
            : "Track who you've reached out to and where things stand."}
        </p>
      </header>

      {total === 0 ? (
        <div className="card empty-state">
          <p>Nothing yet.</p>
          <Link href="/" className="go-link">Generate your first →</Link>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat card">
              <span className="stat-num">{total}</span>
              <span className="stat-label">drafts generated</span>
            </div>
            <div className="stat card">
              <span className="stat-num">{sentItems.length}</span>
              <span className="stat-label">marked as sent</span>
            </div>
            <div className="stat card">
              <span className="stat-num">{repliedCount}</span>
              <span className="stat-label">replied / booked</span>
            </div>
          </div>

          <div className="dash-controls">
            <div className="view-toggle">
              <button data-on={view === "drafts"} onClick={() => setView("drafts")}>
                Drafts
              </button>
              <button data-on={view === "tracker"} onClick={() => setView("tracker")}>
                Outreach Tracker
              </button>
            </div>

            <div className="dash-right">
              <div className="filter-tabs">
                {(["all", "outreach", "coffee"] as Filter[]).map((f) => (
                  <button key={f} data-on={filter === f} onClick={() => setFilter(f)}>
                    {f === "all" ? "All" : f === "outreach" ? "Outreach" : "Coffee"}
                  </button>
                ))}
              </div>
              <button className="reset" onClick={handleClearAll}>Clear all</button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="card empty-state">
              <p>
                {view === "tracker"
                  ? "No sent items yet. Mark a draft as sent to start tracking."
                  : "No items match this filter."}
              </p>
            </div>
          ) : (
            <div className="history">
              {items.map((g) => (
                <div className="hist-card card" key={g.id}>
                  <div className="hist-top">
                    <div className="hist-top-left">
                      <span className="chip sm">{g.matchedProject}</span>
                      {g.sent && g.status && (
                        <button
                          className="status-badge"
                          data-status={g.status}
                          onClick={() => handleCycleStatus(g.id)}
                          title="Click to cycle status"
                        >
                          {STATUS_LABELS[g.status]?.emoji} {STATUS_LABELS[g.status]?.label}
                        </button>
                      )}
                    </div>
                    <span className="hist-meta">
                      {g.mode === "coffee" ? "☕" : "✉"}{" "}
                      {g.recipientName && <strong>{g.recipientName}</strong>}
                      {g.recipientName && " · "}
                      {g.sent && g.sentAt
                        ? `sent ${formatDate(g.sentAt)}`
                        : timeAgo(g.createdAt)}
                    </span>
                  </div>

                  <p className="hist-company">
                    {g.companyText.slice(0, 140)}{g.companyText.length > 140 ? "…" : ""}
                  </p>

                  {g.mode === "coffee" && g.prep ? (
                    <div className="prep-block">
                      <p className="prep-opener">{g.prep.opener}</p>
                      <div className="prep-list">
                        <span className="prep-label">Talking points</span>
                        <ul>{g.prep.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}</ul>
                      </div>
                      <div className="prep-list">
                        <span className="prep-label">Questions to ask</span>
                        <ul>{g.prep.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
                      </div>
                    </div>
                  ) : (
                    <div className="draft">{g.message}</div>
                  )}

                  <div className="draft-actions">
                    <div className="draft-actions-left">
                      {!g.sent && (
                        <button className="action-btn send-btn" onClick={() => handleMarkSent(g.id)}>
                          Mark as sent
                        </button>
                      )}
                      <button className="action-btn delete-btn" onClick={() => handleDelete(g.id)}>
                        Delete
                      </button>
                    </div>
                    <button className="copy" onClick={() => copy(g)}>
                      {copiedId === g.id ? "Copied ✓" : g.mode === "coffee" ? "Copy prep" : "Copy draft"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
