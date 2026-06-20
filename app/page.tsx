"use client";

import { useState } from "react";

type Ranking = { name: string; score: number };
type Result = { message: string; matchedProject: string; ranking: Ranking[] };

export default function Home() {
  const [companyText, setCompanyText] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyText, channel, recipientName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  // Normalize cosine scores to 0–100 for the bars (rescale within the visible range).
  const scores = result?.ranking.map((r) => r.score) ?? [];
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 1);
  const pct = (s: number) => Math.round(((s - min) / (max - min || 1)) * 100);

  return (
    <main className="wrap">
      <header className="masthead">
        <p className="wordmark">Defrost</p>
        <p className="eyebrow">Cohere Embed + Chat</p>
        <h1>Match the company. Draft the message.</h1>
        <p>
          Paste a company&apos;s About page or a role description. Embed v4 scores it against
          my real projects and picks the most relevant one. Chat then drafts the outreach in my
          actual voice — the same thing I&apos;d otherwise write by hand.
        </p>
        <p className="pipeline">
          company text → <b>embed v4</b> → cosine match → <b>command-a</b> → draft
        </p>
      </header>

      <div className="grid">
        {/* INPUT */}
        <section className="card">
          <h2>Input</h2>

          <div className="field">
            <label htmlFor="ct">Company About page / role description</label>
            <textarea
              id="ct"
              placeholder="Paste it here. e.g. 'We're building real-time payments infrastructure for marketplaces...'"
              value={companyText}
              onChange={(e) => setCompanyText(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="rn">Recipient name (optional)</label>
            <input
              id="rn"
              type="text"
              placeholder="e.g. Aidan"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Channel</label>
            <div className="toggle" role="group" aria-label="Channel">
              <button data-on={channel === "email"} onClick={() => setChannel("email")}>
                Email
              </button>
              <button data-on={channel === "linkedin"} onClick={() => setChannel("linkedin")}>
                LinkedIn
              </button>
            </div>
          </div>

          <button className="go" onClick={generate} disabled={loading || companyText.trim().length < 20}>
            {loading ? "Matching + drafting…" : "Generate outreach"}
          </button>
        </section>

        {/* OUTPUT */}
        <section className="card">
          <h2>Result</h2>

          {!result && !loading && !error && (
            <p className="placeholder">
              Your drafted message shows up here, along with which project the embeddings
              matched and how close each one scored.
            </p>
          )}

          {loading && (
            <div className="loading">
              <span className="dot" />
              embedding company → ranking projects → generating
            </div>
          )}

          {error && <p className="err">{error}</p>}

          {result && (
            <>
              <div className="match-head">
                <span className="chip">★ {result.matchedProject}</span>
                <span className="chip-label">chosen by semantic match</span>
              </div>

              <div className="bars">
                {result.ranking.map((r, i) => (
                  <div className="bar-row" key={r.name}>
                    <span className="bar-name" data-top={i === 0}>
                      {r.name}
                    </span>
                    <span className="bar-track">
                      <span
                        className="bar-fill"
                        data-top={i === 0}
                        style={{ width: `${pct(r.score)}%` }}
                      />
                    </span>
                    <span className="bar-val">{r.score.toFixed(3)}</span>
                  </div>
                ))}
              </div>

              <div className="draft">{result.message}</div>
              <div className="draft-actions">
                <button className="copy" onClick={copy}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
