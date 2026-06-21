import { NextRequest, NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects";
import { PROFILE, VOICE_RULES, FEW_SHOT_EXAMPLES } from "@/lib/examples";
import { embed, chat } from "@/lib/cohere";
import { cosineSimilarity } from "@/lib/similarity";

export const runtime = "nodejs";

function profileBlock(profile?: { name?: string; summary?: string; links?: string } | null): string {
  if (profile?.summary?.trim()) {
    const lines = [
      profile.name?.trim() ? `Name: ${profile.name.trim()}` : "",
      profile.summary.trim(),
      profile.links?.trim() ? `Links: ${profile.links.trim()}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  }
  return PROFILE;
}

export async function POST(req: NextRequest) {
  try {
    const { companyText, channel, recipientName, intent, mode = "outreach", profile, templateStructure } = await req.json();

    if (!companyText || typeof companyText !== "string" || companyText.trim().length < 20) {
      return NextResponse.json(
        { error: "Paste a company's About page or LinkedIn bio (at least a sentence or two)." },
        { status: 400 }
      );
    }

    // 1) EMBED — match the company against the project corpus.
    const [[companyVec], projectVecs] = await Promise.all([
      embed([companyText], "search_query"),
      embed(PROJECTS.map((p) => p.embedText), "search_document"),
    ]);

    const ranked = PROJECTS.map((p, i) => ({
      project: p,
      score: cosineSimilarity(companyVec, projectVecs[i]),
    })).sort((a, b) => b.score - a.score);

    const best = ranked[0].project;
    const rankingOut = ranked.map((r) => ({ name: r.project.name, score: r.score }));

    const fewShot = FEW_SHOT_EXAMPLES.map(
      (ex) => `--- EXAMPLE (${ex.channel}) ---\nContext: ${ex.company}\nMessage:\n${ex.message}`
    ).join("\n\n");

    const personName = profile?.name?.trim() || "Maxwell Peng";
    const background = profileBlock(profile);

    // ---------- COFFEE CHAT MODE ----------
    if (mode === "coffee") {
      const system = `You are prepping ${personName} for a coffee chat / informal call with someone at a company they're interested in. Here is who they are:

${background}

TONE: ${VOICE_RULES}

Your job: produce genuinely useful prep that connects their most relevant project to what this company does, so the conversation feels specific and curious — not like an interview.

Return ONLY valid JSON (no markdown, no code fences) with exactly this shape:
{
  "talkingPoints": ["3 short, specific things they can bring up that bridge their matched project to the company's work. Concrete, technical where it helps, not generic."],
  "questions": ["3 thoughtful questions to ask them — genuine curiosity about their product, tech, or team. Not softball, not interview-y."],
  "opener": "A short, warm 2-3 sentence message to request or open the chat, in their voice."
}`;

      const user = `Company / role description:
"""
${companyText.trim()}
"""

${recipientName ? `The person is named ${recipientName}.` : "No name given."}
${intent ? `The person wants: ${intent}. Orient the opener and questions toward that.` : ""}

${personName}'s most relevant project for this company (chosen by semantic match) is:
${best.pitchLine}

Anchor the talking points to that project. Return the JSON now.`;

      const raw = await chat(system, user);
      const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

      let prep;
      try {
        prep = JSON.parse(cleaned);
      } catch {
        prep = { talkingPoints: [], questions: [], opener: cleaned };
      }

      return NextResponse.json({
        mode: "coffee",
        prep,
        matchedProject: best.name,
        ranking: rankingOut,
      });
    }

    // ---------- COLD OUTREACH MODE (default) ----------
    const system = `You write cold outreach for ${personName} to companies they want to work for.
You write ONLY in their voice. Here is who they are:

${background}

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
${intent ? `The goal of this message is: ${intent}. Make sure the message works toward that specific ask, with one clear call to action.` : "End with one clear, low-friction call to action."}
${templateStructure
  ? `STRUCTURAL GUIDE (follow this structure for the message):\n${templateStructure}\n\nFollow this structure while keeping the voice natural.`
  : ""}

The most relevant project to mention (chosen by semantic match against this company) is:
${best.pitchLine}

Weave that project in naturally as the proof point. Draft the ${channel === "email" ? "email" : "LinkedIn message"} now.`;

    const message = await chat(system, user);

    return NextResponse.json({
      mode: "outreach",
      message,
      matchedProject: best.name,
      ranking: rankingOut,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Something went wrong generating." },
      { status: 500 }
    );
  }
}
