import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/cohere";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { draft, instruction } = await req.json();

    if (!draft || typeof draft !== "string") {
      return NextResponse.json({ error: "No draft to refine." }, { status: 400 });
    }
    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json({ error: "No refinement instruction." }, { status: 400 });
    }

    const system =
      "You refine cold outreach drafts. Apply the requested change while preserving the writer's voice, the specific project mentioned, and any subject line. Output ONLY the revised message — no preamble, no commentary, no markdown.";

    const user = `Current draft:
"""
${draft}
"""

Revise it: ${instruction}`;

    const message = await chat(system, user);
    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Refinement failed." },
      { status: 500 }
    );
  }
}
