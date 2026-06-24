import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// AWS Bedrock — Amazon Titan Text Embeddings V2 (1024 dims). Creds come from the
// AWS_* env via the default credential chain. Used on blog publish + per search query.
export const EMBED_DIMS = 1024;
const MODEL = process.env.BEDROCK_EMBED_MODEL_ID || "amazon.titan-embed-text-v2:0";
const REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-west-2";

let _client: BedrockRuntimeClient | null = null;
function client() {
  if (!_client) _client = new BedrockRuntimeClient({ region: REGION });
  return _client;
}

export async function embed(text: string): Promise<number[]> {
  const res = await client().send(
    new InvokeModelCommand({
      modelId: MODEL,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({ inputText: text.slice(0, 8000), dimensions: EMBED_DIMS, normalize: true }),
    }),
  );
  const json = JSON.parse(new TextDecoder().decode(res.body)) as { embedding: number[] };
  return json.embedding;
}
