const MODEL = "text-embedding-3-small"; // 1536 dims

// Single embedding via the OpenAI REST API (no SDK dependency). Used on blog
// publish (the search_summary) and per search query.
export async function embed(text: string): Promise<number[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, input: text.slice(0, 8000) }),
  });
  if (!res.ok) {
    throw new Error(`embeddings ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}
