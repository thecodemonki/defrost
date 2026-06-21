"use client";

import { useEffect, useState } from "react";
import { loadTemplates, saveTemplate, updateTemplate, deleteTemplate, Template } from "@/lib/templates";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tab, setTab] = useState<"email" | "linkedin">("email");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formStructure, setFormStructure] = useState("");

  useEffect(() => setTemplates(loadTemplates()), []);

  const shown = templates.filter((t) => t.channel === tab);

  function startAdd() {
    setAdding(true);
    setEditId(null);
    setFormName("");
    setFormStructure("");
  }

  function startEdit(t: Template) {
    setEditId(t.id);
    setAdding(false);
    setFormName(t.name);
    setFormStructure(t.structure);
  }

  function cancelForm() {
    setAdding(false);
    setEditId(null);
    setFormName("");
    setFormStructure("");
  }

  function handleSave() {
    if (!formName.trim() || !formStructure.trim()) return;
    if (editId) {
      updateTemplate(editId, { name: formName.trim(), structure: formStructure.trim() });
    } else {
      saveTemplate({ name: formName.trim(), channel: tab, structure: formStructure.trim() });
    }
    setTemplates(loadTemplates());
    cancelForm();
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    setTemplates(loadTemplates());
    if (editId === id) cancelForm();
  }

  return (
    <main className="wrap">
      <header className="masthead dash-head">
        <h1 className="dash-h1">Templates</h1>
        <p className="lede">
          Structural guides for how your messages should flow. Pick one when generating and the
          draft follows that shape.
        </p>
      </header>

      <div className="tpl-tabs">
        <div className="filter-tabs">
          <button data-on={tab === "email"} onClick={() => { setTab("email"); cancelForm(); }}>
            ✉ Email
          </button>
          <button data-on={tab === "linkedin"} onClick={() => { setTab("linkedin"); cancelForm(); }}>
            in LinkedIn
          </button>
        </div>
        <button className="tpl-add-btn" onClick={startAdd}>+ New template</button>
      </div>

      {(adding || editId) && (
        <div className="card tpl-form">
          <div className="field">
            <label htmlFor="tpl-name">Template name</label>
            <input
              id="tpl-name"
              type="text"
              placeholder="e.g. Warm intro with project proof"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tpl-struct">Structure</label>
            <textarea
              id="tpl-struct"
              placeholder="e.g. Open with a specific observation about their work. One sentence on the most relevant project. End with a soft ask for a 15-min call."
              value={formStructure}
              onChange={(e) => setFormStructure(e.target.value)}
              style={{ minHeight: 110 }}
            />
          </div>
          <div className="field-row">
            <button className="copy" onClick={cancelForm}>Cancel</button>
            <button className="go" onClick={handleSave} disabled={!formName.trim() || !formStructure.trim()}>
              {editId ? "Update" : "Save template"}
            </button>
          </div>
        </div>
      )}

      {shown.length === 0 && !adding && (
        <div className="card empty-state">
          <p>No {tab} templates yet.</p>
          <button className="go-link" onClick={startAdd}>Create one →</button>
        </div>
      )}

      <div className="tpl-list">
        {shown.map((t) => (
          <div className="card tpl-card" key={t.id}>
            <div className="tpl-card-head">
              <span className="tpl-card-name">{t.name}</span>
              <div className="tpl-card-actions">
                <button className="tpl-action" onClick={() => startEdit(t)}>Edit</button>
                <button className="tpl-action tpl-delete" onClick={() => handleDelete(t.id)}>Delete</button>
              </div>
            </div>
            <p className="tpl-card-body">{t.structure}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
