// Thin wrappers around Cohere's v2 REST API. Using fetch directly (instead of the
// SDK) keeps the dependency surface tiny and the request shape explicit — useful
// when you're explaining the code in an interview.
//
// Docs: https://docs.cohere.com/reference/chat   (v2/chat)
//       https://docs.cohere.com/reference/embed  (v2/embed)

const COHERE_BASE = "https://api.cohere.com/v2";

// command-a-03-2025 is Cohere's current general flagship and works on a trial key.
// Swap to "command-a-plus-05-2026" if you want their newest.
const CHAT_MODEL = "command-a-03-2025";
const EMBED_MODEL = "embed-v4.0";

function headers() {
  const key = process.env.COHERE_API_KEY;
  if (!key) throw new Error("COHERE_API_KEY is not set. Add it to .env.local");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/** Embed a batch of texts. `inputType` is "search_query" for the thing you're
 *  searching with, "search_document" for the corpus you're searching over. */
export async function embed(
  texts: string[],
  inputType: "search_query" | "search_document"
): Promise<number[][]> {
  const res = await fetch(`${COHERE_BASE}/embed`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: EMBED_MODEL,
      input_type: inputType,
      embedding_types: ["float"],
      texts,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Cohere embed failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.embeddings.float as number[][];
}

/** Generate a chat completion from a system + user prompt. */
export async function chat(system: string, user: string): Promise<string> {
  const res = await fetch(`${COHERE_BASE}/chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Cohere chat failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  // v2 chat returns message.content as an array of blocks; grab the text.
  const text = data?.message?.content?.find((b: any) => b.type === "text")?.text;
  return (text ?? "").trim();
}
