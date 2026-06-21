// User profile, persisted in the browser (same pattern as history).
export type Profile = {
  name: string;
  summary: string;     // distilled background paragraph
  links: string;       // portfolio / github / linkedin, freeform
  raw: string;         // original pasted resume, kept so the user can re-edit
  updatedAt: number;
};

const KEY = "defrost:profile";

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Omit<Profile, "updatedAt">): Profile {
  const item: Profile = { ...p, updatedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(item));
  return item;
}

export function clearProfile() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
