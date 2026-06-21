// Local generation history, persisted in the browser. No backend needed — works
// the same locally and on Vercel. (Per-browser; that's fine for a portfolio tool.)

export type Prep = { talkingPoints: string[]; questions: string[]; opener: string };

export type Generation = {
  id: string;
  createdAt: number;
  mode: "outreach" | "coffee";
  companyText: string;
  recipientName: string;
  channel: "email" | "linkedin";
  matchedProject: string;
  ranking: { name: string; score: number }[];
  message: string; // outreach draft, or a flattened text version of coffee prep (for copy)
  prep?: Prep;      // structured coffee-chat prep, when mode === "coffee"
  intent?: string;
};

const KEY = "defrost:history";
const CAP = 50;

export function loadHistory(): Generation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGeneration(g: Omit<Generation, "id" | "createdAt">): Generation {
  const item: Generation = { ...g, id: crypto.randomUUID(), createdAt: Date.now() };
  const next = [item, ...loadHistory()].slice(0, CAP);
  localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function clearHistory() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

// Flatten coffee-chat prep into a single copyable block.
export function prepToText(prep: Prep): string {
  const parts: string[] = [];
  if (prep.opener) parts.push(prep.opener);
  if (prep.talkingPoints?.length)
    parts.push("Talking points:\n" + prep.talkingPoints.map((t) => `• ${t}`).join("\n"));
  if (prep.questions?.length)
    parts.push("Questions to ask:\n" + prep.questions.map((q) => `• ${q}`).join("\n"));
  return parts.join("\n\n");
}
