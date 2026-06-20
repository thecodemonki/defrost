import { NextRequest, NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects";
import { PROFILE, VOICE_RULES, FEW_SHOT_EXAMPLES } from "@/lib/examples";
import { embed, chat } from "@/lib/cohere";
import { cosineSimilarity } from "@/lib/similarity";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { companyText, channel, recipientName } = await req.json();

    if (!companyText || typeof companyText !== "string" || companyText.trim().length < 20) {
      return NextResponse.json(
        { error: "Paste a company's About page or LinkedIn bio (at least a sentence or two)." },
        { status: 400 }
      );
    }

    // 1) EMBED — match the company against the project corpus.
    //    Query = company text; documents = the project descriptions.
    const [[companyVec], projectVecs] = await Promise.all([
      embed([companyText], "search_query"),
      embed(PROJECTS.map((p) => p.embedText), "search_document"),
    ]);

    const ranked = PROJECTS.map((p, i) => ({
      project: p,
      score: cosineSimilarity(companyVec, projectVecs[i]),
    })).sort((a, b) => b.score - a.score);

    const best = ranked[0].project;

    // 2) CHAT — draft the message in Maxwell's voice, told to feature the matched project.
    const fewShot = FEW_SHOT_EXAMPLES.map(
      (ex) =>
        `--- EXAMPLE (${ex.channel}) ---\nContext: ${ex.company}\nMessage:\n${ex.message}`
    ).join("\n\n");

    const system = `You write cold outreach for Maxwell Peng to companies he wants to work for.
You write ONLY in his voice. Here is who he is:

${PROFILE}

VOICE RULES (follow exactly):
${VOICE_RULES}

Here are real examples of how Maxwell writes:

${fewShot}

Output only the message itself. No preamble, no explanation, no notes.
${channel === "email" ? "Include a short, specific subject line on the first line as 'Subject: ...'." : "This is a LinkedIn DM — no subject line, keep it tight."}`;

    const user = `Company / role description:
"""
${companyText.trim()}
"""

${recipientName ? `Address it to: ${recipientName}.` : "Don't invent a name; open generally if none is given."}

The most relevant project to mention (chosen by semantic match against this company) is:
${best.pitchLine}

Weave that project in naturally as the proof point. Draft the ${channel === "email" ? "email" : "LinkedIn message"} now.`;

    const message = await chat(system, user);

    return NextResponse.json({
      message,
      matchedProject: best.name,
      ranking: ranked.map((r) => ({ name: r.project.name, score: r.score })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Something went wrong generating the message." },
      { status: 500 }
    );
  }
}
