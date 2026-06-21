"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadHistory, clearHistory, prepToText, Generation } from "@/lib/history";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type Filter = "all" | "outreach" | "coffee";

export default function Dashboard() {
  const [history, setHistory] = useState<Generation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setHistory(loadHistory()), []);

  function reset() {
    clearHistory();
    setHistory([]);
  }

  function copy(g: Generation) {
    const text = g.mode === "coffee" && g.prep ? prepToText(g.prep) : (g.message ?? "");
    navigator.clipboard.writeText(text);
    setCopiedId(g.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // Stats (null-safe against older entries)
  const total = history.length;
  const byProject: Record<string, number> = {};
  history.forEach((g) => {
    if (g.matchedProject) byProject[g.matchedProject] = (byProject[g.matchedProject] || 0) + 1;
  });
  const topProject = Object.entries(byProject).sort((a, b) => b[1] - a[1])[0];
  const coffeeCount = history.filter((g) => g.mode === "coffee").length;
  const outreachCount = total - coffeeCount;

  const shown = history.filter((g) => {
    if (filter === "coffee") return g.mode === "coffee";
    if (filter === "outreach") return g.mode !== "coffee";
    return true;
  });

  return (
    <main className="wrap">
      <header className="masthead dash-head">
        <h1 className="dash-h1">Dashboard</h1>
        <p className="lede">Every draft and chat prep you&apos;ve generated, and what the matcher keeps surfacing.</p>
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
              <span className="stat-label">total generated</span>
            </div>
            <div className="stat card">
              <span className="stat-num">{topProject ? topProject[0] : "—"}</span>
              <span className="stat-label">most-matched project</span>
            </div>
            <div className="stat card">
              <span className="stat-num">{outreachCount}<span className="stat-sub"> · {coffeeCount}</span></span>
              <span className="stat-label">outreach · coffee</span>
            </div>
          </div>

          <div className="history-head">
            <div className="filter-tabs">
              {(["all", "outreach", "coffee"] as Filter[]).map((f) => (
                <button key={f} data-on={filter === f} onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "outreach" ? "Outreach" : "Coffee"}
                </button>
              ))}
            </div>
            <button className="reset" onClick={reset}>Clear all</button>
          </div>

          <div className="history">
            {shown.map((g) => (
              <div className="hist-card card" key={g.id}>
                <div className="hist-top">
                  <span className="chip sm">{g.matchedProject}</span>
                  <span className="hist-meta">
                    {g.mode === "coffee" ? "☕ coffee chat" : `✉ ${g.channel}`} · {timeAgo(g.createdAt)}
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
                  <button className="copy" onClick={() => copy(g)}>
                    {copiedId === g.id ? "Copied ✓" : g.mode === "coffee" ? "Copy prep" : "Copy draft"}
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
