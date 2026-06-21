import { NextRequest, NextResponse } from "next/server";
import { extractCompanyText } from "@/lib/cohere";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "No valid image provided." }, { status: 400 });
    }

    const text = await extractCompanyText(imageDataUrl);

    if (!text) {
      return NextResponse.json(
        { error: "Couldn't read any company info from that screenshot." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Vision extraction failed." },
      { status: 500 }
    );
  }
}
