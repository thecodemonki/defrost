export type Template = {
  id: string;
  name: string;
  channel: "email" | "linkedin";
  structure: string; // e.g. "Open with an observation about their work, one line on a relevant project, end with a soft ask for a call"
  createdAt: number;
};

const KEY = "defrost:templates";

export function loadTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTemplate(t: Omit<Template, "id" | "createdAt">): Template {
  const item: Template = { ...t, id: crypto.randomUUID(), createdAt: Date.now() };
  const next = [item, ...loadTemplates()];
  localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function updateTemplate(id: string, updates: Partial<Omit<Template, "id" | "createdAt">>): void {
  const all = loadTemplates().map((t) => (t.id === id ? { ...t, ...updates } : t));
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteTemplate(id: string): void {
  const next = loadTemplates().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}
