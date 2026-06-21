"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { saveGeneration, prepToText, Prep } from "@/lib/history";
import { loadProfile } from "@/lib/profile";
import { loadTemplates, Template } from "@/lib/templates";

type Ranking = { name: string; score: number };
type Result = {
  mode: "outreach" | "coffee";
  message?: string;
  prep?: Prep;
  matchedProject: string;
  ranking: Ranking[];
};

const PIPELINE = [
  { label: "screenshot", kind: "data" },
  { label: "command-a-vision", kind: "model" },
  { label: "embed v4", kind: "model" },
  { label: "cosine match", kind: "op" },
  { label: "command-a", kind: "model" },
  { label: "draft", kind: "data" },
];

export default function Home() {
  const [companyText, setCompanyText] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [channel, setChannel] = useState<"email" | "linkedin">("email");
  const [intent, setIntent] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [mode, setMode] = useState<"outreach" | "coffee">("outreach");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [refining, setRefining] = useState(false);
  const [customRefine, setCustomRefine] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => setTemplates(loadTemplates()), []);

  useEffect(() => setSelectedTemplate(""), [channel]);

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("Couldn't read that file."));
      r.readAsDataURL(file);
    });
  }

  async function readScreenshot(file: File) {
    if (!file.type.startsWith("image/")) return;
    setReading(true);
    setError("");
    try {
      const imageDataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read the screenshot.");
      setCompanyText(data.text);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReading(false);
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const img = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (img) {
      const file = img.getAsFile();
      if (file) {
        e.preventDefault();
        readScreenshot(file);
      }
    }
  }

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);
    try {
      const tpl = templates.find((t) => t.id === selectedTemplate);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyText,
          channel,
          recipientName,
          intent,
          mode,
          profile: loadProfile(),
          templateStructure: tpl?.structure || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      const messageForHistory =
        data.mode === "coffee" && data.prep ? prepToText(data.prep) : data.message || "";
      saveGeneration({
        mode: data.mode,
        companyText,
        recipientName,
        channel,
        intent,
        matchedProject: data.matchedProject,
        ranking: data.ranking,
        message: messageForHistory,
        prep: data.prep,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function refine(instruction: string) {
    if (!result || refining) return;
    setRefining(true);
    setError("");
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: result.message, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't refine.");
      setResult({ ...result, message: data.message });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefining(false);
    }
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
          <span className="h1-accent">{mode === "coffee" ? "Prep the chat." : "Draft the message."}</span>
        </h1>
        <p className="lede">
          Paste a company&apos;s About page, a role description, or a screenshot. Embed v4 scores
          it against my real projects and picks the most relevant one. Chat then{" "}
          {mode === "coffee" ? "preps me for a coffee chat" : "drafts the outreach"} in my actual voice.
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

      {/* MODE TOGGLE */}
      <div className="mode-toggle" role="group" aria-label="Mode">
        <button data-on={mode === "outreach"} onClick={() => setMode("outreach")}>
          ✉ Cold outreach
        </button>
        <button data-on={mode === "coffee"} onClick={() => setMode("coffee")}>
          ☕ Coffee chat
        </button>
      </div>

      {/* INPUT */}
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
          <div className="label-row">
            <label htmlFor="ct">Company About page / role description</label>
            <button
              type="button"
              className="snap-btn"
              onClick={() => fileRef.current?.click()}
              disabled={reading}
            >
              {reading ? "Reading…" : "↑ Read from screenshot"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && readScreenshot(e.target.files[0])}
            />
          </div>
          <textarea
            id="ct"
            placeholder="Paste text here — or paste a screenshot directly and command-a-vision will read it."
            value={companyText}
            onChange={(e) => setCompanyText(e.target.value)}
            onPaste={onPaste}
          />
          {reading && <p className="reading-note">command-a-vision is reading the screenshot…</p>}
        </div>

        <div className="field">
          <label htmlFor="intent">What do you want from this? <span className="opt">optional</span></label>
          <input
            id="intent"
            type="text"
            placeholder="e.g. a 15-min intro call · a referral · feedback on my portfolio"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          />
        </div>

        {mode !== "coffee" && templates.filter((t) => t.channel === channel).length > 0 && (
          <div className="field">
            <label>Template <span className="opt">optional</span></label>
            <select
              className="tpl-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">None — free-form</option>
              {templates.filter((t) => t.channel === channel).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field-row">
          {mode === "outreach" && (
            <div className="toggle" role="group" aria-label="Channel">
              <button data-on={channel === "email"} onClick={() => setChannel("email")}>Email</button>
              <button data-on={channel === "linkedin"} onClick={() => setChannel("linkedin")}>LinkedIn</button>
            </div>
          )}
          <button
            className="go"
            onClick={generate}
            disabled={loading || reading || companyText.trim().length < 20}
          >
            {loading
              ? mode === "coffee" ? "Matching + prepping…" : "Matching + drafting…"
              : mode === "coffee" ? "Prep coffee chat" : "Generate outreach"}
          </button>
        </div>
      </section>

      {/* LOADING */}
      {loading && (
        <div className="loading card">
          <span className="dot" />
          <span className="dot" style={{ animationDelay: "0.15s" }} />
          <span className="dot" style={{ animationDelay: "0.3s" }} />
          <span className="loading-text">
            {mode === "coffee" ? "embedding → ranking → prepping" : "embedding → ranking → generating"}
          </span>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="err card">
          <strong>Something went wrong.</strong> {error}
        </div>
      )}

      {/* RESULT */}
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

          {/* OUTREACH OUTPUT */}
          {result.mode === "outreach" && result.message && (
            <div className="draft-wrap">
              <div className="draft">{result.message}</div>
              <div className="refine-bar">
                <span className="refine-label">Refine:</span>
                {["Shorter", "Warmer", "More specific", "Less formal"].map((chip) => (
                  <button
                    key={chip}
                    className="refine-chip"
                    onClick={() => refine(chip.toLowerCase())}
                    disabled={refining}
                  >
                    {chip}
                  </button>
                ))}
                <div className="refine-custom">
                  <input
                    type="text"
                    placeholder="or tell it what to change…"
                    value={customRefine}
                    onChange={(e) => setCustomRefine(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customRefine.trim()) {
                        refine(customRefine.trim());
                        setCustomRefine("");
                      }
                    }}
                    disabled={refining}
                  />
                </div>
                {refining && <span className="refine-status">refining…</span>}
              </div>
              <div className="draft-actions">
                <Link href="/dashboard" className="ghost-link">Saved to dashboard →</Link>
                <button className="copy" onClick={() => copyText(result.message!)}>
                  {copied ? "Copied ✓" : "Copy draft"}
                </button>
              </div>
            </div>
          )}

          {/* COFFEE CHAT OUTPUT */}
          {result.mode === "coffee" && result.prep && (
            <div className="draft-wrap">
              {result.prep.opener && (
                <div className="prep-block">
                  <h3 className="prep-label">Opener</h3>
                  <div className="draft">{result.prep.opener}</div>
                </div>
              )}
              {result.prep.talkingPoints?.length > 0 && (
                <div className="prep-block">
                  <h3 className="prep-label">Talking points</h3>
                  <ul className="prep-list">
                    {result.prep.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
              {result.prep.questions?.length > 0 && (
                <div className="prep-block">
                  <h3 className="prep-label">Questions to ask</h3>
                  <ul className="prep-list questions">
                    {result.prep.questions.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              )}
              <div className="draft-actions">
                <Link href="/dashboard" className="ghost-link">Saved to dashboard →</Link>
                <button className="copy" onClick={() => copyText(prepToText(result.prep!))}>
                  {copied ? "Copied ✓" : "Copy prep"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <footer className="foot">
        <span>Cohere Vision + Embed v4 + command-a</span>
        <span className="foot-sep">·</span>
        <span>Next.js</span>
        <span className="foot-sep">·</span>
        <a href="https://maxwellpeng.com">maxwellpeng.com</a>
      </footer>
    </main>
  );
}
