import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/cohere";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { resume } = await req.json();
    if (!resume || typeof resume !== "string" || resume.trim().length < 30) {
      return NextResponse.json({ error: "Paste a bit more of your resume." }, { status: 400 });
    }

    const system =
      "You extract a concise professional profile from a resume. Return ONLY valid JSON, no markdown fences, with exactly these keys: " +
      '"name" (string, the person\'s full name or "" if not found), ' +
      '"summary" (string, 2-3 sentences in first person describing who they are, their focus, and strongest experience — natural and down to earth, no buzzwords), ' +
      '"links" (string, any portfolio/github/linkedin URLs found, space-separated, or "").';

    const user = `Resume:\n"""\n${resume.trim()}\n"""`;

    const raw = await chat(system, user);
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: { name: string; summary: string; links: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { name: "", summary: cleaned, links: "" };
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Couldn't process resume." }, { status: 500 });
  }
}
