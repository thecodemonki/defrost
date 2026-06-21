import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/cohere";

export const runtime = "nodejs";

async function extractText(req: NextRequest): Promise<string> {
  const contentType = req.headers.get("content-type") || "";

  // File upload path
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) throw new Error("No file uploaded.");

    const buf = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    if (name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buf });
      const result = await parser.getText();
      await parser.destroy();
      return result.text || "";
    }
    if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const data = await mammoth.extractRawText({ buffer: buf });
      return data.value || "";
    }
    throw new Error("Unsupported file type. Upload a PDF or .docx.");
  }

  // Pasted-text path (unchanged behaviour)
  const body = await req.json();
  return typeof body.resume === "string" ? body.resume : "";
}

export async function POST(req: NextRequest) {
  try {
    let resume = "";
    try {
      resume = await extractText(req);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Couldn't read the file." }, { status: 400 });
    }

    if (!resume || resume.trim().length < 30) {
      return NextResponse.json(
        { error: "Couldn't get enough text from that. Try pasting it instead — the file may be a scanned image with no text layer." },
        { status: 422 }
      );
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

    return NextResponse.json({ ...parsed, raw: resume.trim() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Couldn't process resume." }, { status: 500 });
  }
}
