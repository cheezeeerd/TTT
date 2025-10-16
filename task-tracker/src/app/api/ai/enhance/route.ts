import { NextResponse } from "next/server";
import { rateLimit } from "@/middleware/rateLimit";
import OpenAI from "openai";
import { z } from "zod";

const schema = z.object({
  raw: z.string().min(1),
  persona: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "127.0.0.1").split(",")[0].trim();
  const rl = rateLimit(`enhance:${ip}`);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const openai = new OpenAI({ apiKey });

  const system = `You are an expert executive assistant helping a Marketing Coordinator at YYZ Travel Agency in Ontario. Improve their task text: fix grammar, clarify, infer reasonable details, and split into 3-8 concise subtasks with checkable phrasing. Mark priority as URGENT only if time-sensitive or impactful.`;

  const user = `Raw input: ${parsed.data.raw}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    tools: undefined,
    max_tokens: 600,
  } as any);

  const content = response.choices?.[0]?.message?.content || "{}";
  // Expect shape: { title: string, body?: string, subtasks?: string[], priority?: "URGENT"|"NORMAL" }
  let json: any = {};
  try { json = JSON.parse(content); } catch {}
  if (typeof json.title !== "string") json.title = parsed.data.raw;
  if (!Array.isArray(json.subtasks)) json.subtasks = [];
  if (json.priority !== "URGENT") json.priority = "NORMAL";

  return NextResponse.json(json);
}
