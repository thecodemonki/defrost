"use client";

import { useEffect, useState } from "react";
import { loadProfile, saveProfile, clearProfile } from "@/lib/profile";

export default function ProfilePage() {
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [links, setLinks] = useState("");
  const [distilling, setDistilling] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (p) { setRaw(p.raw); setName(p.name); setSummary(p.summary); setLinks(p.links); }
  }, []);

  async function distill() {
    setDistilling(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't distill.");
      setName(data.name || "");
      setSummary(data.summary || "");
      setLinks(data.links || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDistilling(false);
    }
  }

  function save() {
    saveProfile({ name, summary, links, raw });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function reset() {
    clearProfile();
    setRaw(""); setName(""); setSummary(""); setLinks("");
  }

  return (
    <main className="wrap">
      <header className="masthead dash-head">
        <h1 className="dash-h1">Your profile</h1>
        <p className="lede">Paste your resume once. It gets distilled and woven into every draft so the outreach sounds like you.</p>
      </header>

      <section className="card">
        <div className="field">
          <label htmlFor="resume">Resume / background</label>
          <textarea
            id="resume"
            placeholder="Paste your resume or a paragraph about yourself…"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>
        <button className="go" onClick={distill} disabled={distilling || raw.trim().length < 30}>
          {distilling ? "Distilling…" : "Distill with Cohere"}
        </button>
      </section>

      {(name || summary || links) && (
        <section className="card">
          <div className="field">
            <label htmlFor="pname">Name</label>
            <input id="pname" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="psum">Summary</label>
            <textarea id="psum" value={summary} onChange={(e) => setSummary(e.target.value)} style={{ minHeight: 110 }} />
          </div>
          <div className="field">
            <label htmlFor="plinks">Links</label>
            <input id="plinks" type="text" value={links} onChange={(e) => setLinks(e.target.value)} />
          </div>
          <div className="field-row">
            <button className="copy" onClick={reset}>Clear profile</button>
            <button className="go" onClick={save}>{saved ? "Saved ✓" : "Save profile"}</button>
          </div>
        </section>
      )}

      {error && <div className="err card"><strong>Something went wrong.</strong> {error}</div>}
    </main>
  );
}
