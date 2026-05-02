/**
 * AI plan generator.
 *
 * If process.env.ANTHROPIC_API_KEY is set, we call the Anthropic Messages API
 * directly via fetch (no SDK dependency) and ask Claude to return a JSON list
 * of tasks following the SampleTask shape.
 *
 * If no key is configured, we fall back to a deterministic stub that picks
 * tasks from the seeded sampleTasks list, lightly biased by keywords in the
 * user's context. This keeps the prototype usable with zero secrets.
 */

import { z } from "zod";
import {
  sampleTasks,
  type Priority,
  type SampleTask,
} from "~/server/data/sample-data";

const TaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  datetime: z.string().min(1),
  recommendReason: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
});

const ResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

const SYSTEM_PROMPT = `You are an empathetic academic study planner for an overwhelmed university student at ANU.

Given the student's free-text context (mood, deadlines, what's stressing them), produce a short, actionable plan.

Return ONLY a single JSON object — no prose, no markdown fences — with this exact shape:

{
  "tasks": [
    {
      "name": "short, action-oriented title (≤8 words)",
      "description": "1–2 sentences of concrete first-step detail",
      "datetime": "YYYY-MM-DD HH:MM (local time, within the next 7 days)",
      "recommendReason": "1 sentence explaining why this task is worth doing now",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Rules:
- Mix academic tasks with at least one wellbeing item (walk, sleep, break) when stress is high.
- Keep names imperative ("Draft intro", "Email Prof. Lee").
- Be specific in descriptions — name a chapter, a friend, a length.
- Spread datetimes across different days; don't pile everything on one day.`;

export type GeneratePlanInput = {
  context: string;
  count: number;
};

export type GeneratePlanResult = {
  source: "anthropic" | "stub";
  tasks: SampleTask[];
  note?: string;
};

export async function generatePlan({
  context,
  count,
}: GeneratePlanInput): Promise<GeneratePlanResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const safeCount = Math.min(Math.max(count, 1), 10);

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const tasks = await callAnthropic(apiKey, context, safeCount);
      return { source: "anthropic", tasks };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown Anthropic error";
      // Fall back to the stub but flag the failure so the UI can show it.
      return {
        source: "stub",
        tasks: stubPlan(context, safeCount),
        note: `Anthropic call failed (${message}); using sample-data fallback.`,
      };
    }
  }

  return {
    source: "stub",
    tasks: stubPlan(context, safeCount),
    note: "ANTHROPIC_API_KEY not set — using sample-data fallback.",
  };
}

async function callAnthropic(
  apiKey: string,
  context: string,
  count: number,
): Promise<SampleTask[]> {
  const userPrompt = `Student context:\n"""\n${context}\n"""\n\nProduce exactly ${count} tasks.`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Anthropic ${r.status}: ${body.slice(0, 200)}`);
  }

  const data = (await r.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = (data.content ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();

  // Extract the first {...} block in case Claude added stray prose.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("No JSON object in model response");
  }

  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  const validated = ResponseSchema.parse(parsed);
  return validated.tasks.slice(0, count);
}

/**
 * Deterministic fallback: pick `count` items from sampleTasks, biased by
 * keywords in the user's context.
 */
function stubPlan(context: string, count: number): SampleTask[] {
  const ctx = context.toLowerCase();

  const stressed =
    /stress|overwhelm|tired|exhaust|anxious|burnout|panic|累|压力|焦虑/.test(
      ctx,
    );
  const examPressure =
    /exam|midterm|final|deadline|due|quiz|考试|作业|deadline/.test(ctx);
  const social = /friend|group|team|partner|朋友|小组/.test(ctx);

  const score = (t: SampleTask): number => {
    let s = 0;
    const blob = `${t.name} ${t.description} ${t.recommendReason}`.toLowerCase();
    if (stressed && /(walk|sleep|break|stress|reset|寝|休息|散步)/.test(blob))
      s += 3;
    if (examPressure && /(deadline|due|problem set|lab|essay|reflection|outline)/.test(blob))
      s += 3;
    if (social && /(group|study group|friend|presentation)/.test(blob)) s += 2;
    s += priorityWeight(t.priority);
    return s;
  };

  return [...sampleTasks]
    .sort((a, b) => score(b) - score(a))
    .slice(0, count);
}

function priorityWeight(p: Priority): number {
  return p === "high" ? 2 : p === "medium" ? 1 : 0;
}
