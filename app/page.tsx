"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { saveGeneration } from "@/lib/history";

type Ranking = { name: string; score: number };
type Result = { message: string; matchedProject: string; ranking: Ranking[] };

const PIPELINE = [
  { label: "company text", kind: "data" },
  { label: "embed v4", kind: "model" },
  { label: "cosine match", kind: "op" },
  { label: "command-a", kind: "model" },
  { label: "draft", kind: "data" },
];

export default function Home() {
  const [companyText, setCompanyText] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

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
      saveGeneration({
        companyText,
        recipientName,
        channel,
        matchedProject: data.matchedProject,
        ranking: data.ranking,
        message: data.message,
      });
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

  const scores = result?.ranking.map((r) => r.score) ?? [];
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 1);
  const pct = (s: number) => Math.round(((s - min) / (max - min || 1)) * 100);

  return (
    <main className="wrap">
      <header className="masthead">
        <h1>
          Match the company.<br />
          <span className="h1-accent">Draft the message.</span>
        </h1>
        <p className="lede">
          Paste a company&apos;s About page or a role description. Embed v4 scores it against my
          real projects and picks the most relevant one. Chat drafts the outreach in my actual
          voice.
        </p>

        <div className="pipeline" aria-label="How it works">
          {PIPELINE.map((step, i) => (
            <span className="pipeline-row" key={step.label}>
              <span className="node" data-kind={step.kind}>{step.label}</span>
              {i < PIPELINE.length - 1 && <span className="arrow">→</span>}
            </span>
          ))}
        </div>
      </header>

      <section className="card">
        <div className="field">
          <label htmlFor="rn">Recipient name <span className="opt">optional</span></label>
          <input
            id="rn"
            type="text"
            placeholder="e.g. Aidan"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="ct">Company About page / role description</label>
          <textarea
            id="ct"
            placeholder="Paste it here. e.g. 'We're building real-time payments infrastructure for marketplaces…'"
            value={companyText}
            onChange={(e) => setCompanyText(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="toggle" role="group" aria-label="Channel">
            <button data-on={channel === "email"} onClick={() => setChannel("email")}>Email</button>
            <button data-on={channel === "linkedin"} onClick={() => setChannel("linkedin")}>LinkedIn</button>
          </div>
          <button
            className="go"
            onClick={generate}
            disabled={loading || companyText.trim().length < 20}
          >
            {loading ? "Matching + drafting…" : "Generate outreach"}
          </button>
        </div>
      </section>

      {loading && (
        <div className="loading card">
          <span className="dot" />
          <span className="dot" style={{ animationDelay: "0.15s" }} />
          <span className="dot" style={{ animationDelay: "0.3s" }} />
          <span className="loading-text">embedding → ranking → generating</span>
        </div>
      )}

      {error && (
        <div className="err card">
          <strong>Couldn&apos;t generate.</strong> {error}
        </div>
      )}

      {result && (
        <section className="card result-card" ref={resultRef}>
          <div className="match-head">
            <span className="match-tag">matched</span>
            <span className="chip">{result.matchedProject}</span>
          </div>

          <div className="bars">
            {result.ranking.map((r, i) => (
              <div className="bar-row" key={r.name}>
                <span className="bar-name" data-top={i === 0}>
                  {i === 0 && <span className="star">★</span>}{r.name}
                </span>
                <span className="bar-track">
                  <span className="bar-fill" data-top={i === 0} style={{ width: `${pct(r.score)}%` }} />
                </span>
                <span className="bar-val">{r.score.toFixed(3)}</span>
              </div>
            ))}
          </div>

          <div className="draft-wrap">
            <div className="draft">{result.message}</div>
            <div className="draft-actions">
              <Link href="/dashboard" className="ghost-link">Saved to dashboard →</Link>
              <button className="copy" onClick={copy}>{copied ? "Copied ✓" : "Copy draft"}</button>
            </div>
          </div>
        </section>
      )}

      <footer className="foot">
        <span>Cohere Embed v4 + command-a</span>
        <span className="foot-sep">·</span>
        <span>Next.js</span>
        <span className="foot-sep">·</span>
        <a href="https://maxwellpeng.com">maxwellpeng.com</a>
      </footer>
    </main>
  );
}
