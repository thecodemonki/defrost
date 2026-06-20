"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadHistory, clearHistory, Generation } from "@/lib/history";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard() {
  const [history, setHistory] = useState<Generation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => setHistory(loadHistory()), []);

  function reset() {
    clearHistory();
    setHistory([]);
  }

  function copy(g: Generation) {
    navigator.clipboard.writeText(g.message);
    setCopiedId(g.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const total = history.length;
  const byProject: Record<string, number> = {};
  history.forEach((g) => (byProject[g.matchedProject] = (byProject[g.matchedProject] || 0) + 1));
  const topProject = Object.entries(byProject).sort((a, b) => b[1] - a[1])[0];
  const emails = history.filter((g) => g.channel === "email").length;

  return (
    <main className="wrap">
      <header className="masthead dash-head">
        <h1 className="dash-h1">Dashboard</h1>
        <p className="lede">Every draft you&apos;ve generated, and what the matcher keeps surfacing.</p>
      </header>

      {total === 0 ? (
        <div className="card empty-state">
          <p>No drafts yet.</p>
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
              <span className="stat-num">{topProject ? topProject[0] : "—"}</span>
              <span className="stat-label">most-matched project</span>
            </div>
            <div className="stat card">
              <span className="stat-num">{emails}<span className="stat-sub">/{total}</span></span>
              <span className="stat-label">were emails</span>
            </div>
          </div>

          <div className="history-head">
            <h2 className="section-label">History</h2>
            <button className="reset" onClick={reset}>Clear all</button>
          </div>

          <div className="history">
            {history.map((g) => (
              <div className="hist-card card" key={g.id}>
                <div className="hist-top">
                  <span className="chip sm">{g.matchedProject}</span>
                  <span className="hist-meta">{g.channel} · {timeAgo(g.createdAt)}</span>
                </div>
                <p className="hist-company">{g.companyText.slice(0, 140)}{g.companyText.length > 140 ? "…" : ""}</p>
                <div className="draft">{g.message}</div>
                <div className="draft-actions">
                  <button className="copy" onClick={() => copy(g)}>
                    {copiedId === g.id ? "Copied ✓" : "Copy draft"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
