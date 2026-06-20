// Local generation history, persisted in the browser. No backend needed — works
// the same locally and on Vercel. (Per-browser; that's fine for a portfolio tool.)

export type Generation = {
  id: string;
  createdAt: number;
  companyText: string;
  recipientName: string;
  channel: "email" | "linkedin";
  matchedProject: string;
  ranking: { name: string; score: number }[];
  message: string;
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
