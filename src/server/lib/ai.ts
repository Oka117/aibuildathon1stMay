/**
 * AI plan generator.
 *
 * If process.env.DEEPSEEK_API_KEY is set, we call the DeepSeek Chat
 * Completions API (OpenAI-compatible) directly via fetch (no SDK
 * dependency) and ask the model to return a JSON list of tasks
 * following the SampleTask shape.
 *
 * If no key is configured, we fall back to a deterministic stub that picks
 * tasks from the user's existing saved cards (if any) or — as a last
 * resort — the seeded sampleTasks list, lightly biased by keywords in the
 * user's context. This keeps the prototype usable with zero secrets.
 */

import { z } from "zod";
import {
  sampleTasks,
  type Priority,
  type SampleTask,
} from "~/server/data/sample-data";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const TaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  recommendReason: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  suggestedTime: z.string().min(1),
  day: z.number().int().min(0).max(6),
  start: z.number().min(0).max(23),
  duration: z.number().min(0.5).max(8),
});

const ResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

const SYSTEM_PROMPT = `You are an empathetic academic study planner for an overwhelmed university student at ANU.

You receive:
  1. The student's free-text "Talk to your planner" message (mood, deadlines, what's stressing them).
  2. The student's existing saved cards — short notes/tasks they've already added themselves.

Your job: rank, refine, and re-frame items DRAWN FROM THE EXISTING CARDS so they directly address what the student just said. You may also rephrase a card's name/description to make it more actionable, and you must always provide a fresh "recommendReason" that explicitly ties the card back to a specific phrase from the student's message. You must also propose a concrete time slot for each task that makes sense given the student's situation.

Return ONLY a single JSON object — no prose, no markdown fences — with this exact shape:

{
  "tasks": [
    {
      "name": "short, action-oriented title (≤8 words) — derived from one of the existing cards",
      "description": "1–2 sentences of concrete first-step detail",
      "recommendReason": "1 sentence connecting this task to a specific concern in the student's message",
      "priority": "high" | "medium" | "low",
      "suggestedTime": "human-readable slot like 'Tue 14:00–15:30' or 'Fri 09:00–10:00'",
      "day": 0..6 (0 = Mon … 6 = Sun) — must match suggestedTime,
      "start": 0..23 (24-hour start hour, e.g. 14 for 2 PM) — must match suggestedTime,
      "duration": 0.5..4 (hours) — must match suggestedTime
    }
  ]
}

Rules:
- Pick tasks ONLY from the provided existing cards. Do NOT invent new tasks the student hasn't already saved.
- If the student mentions stress / tiredness, prioritise wellbeing-related cards (sleep, walk, break) when they exist.
- If the student mentions deadlines / exams, prioritise academic cards.
- Keep names imperative ("Draft intro", "Email Prof. Lee").
- recommendReason MUST quote or paraphrase a concrete phrase from the student's message.
- Spread suggestedTime across different days; don't pile everything on one day.
- Prefer 1–1.5 h focus blocks for academic work, and 30 min for wellbeing.
- "start" must be between 8 and 20 (waking hours). "duration" should usually be 0.5, 1, 1.5, or 2.
- "day", "start", "duration" must be consistent with the human-readable "suggestedTime" string.
- If there are fewer existing cards than requested, return all of them, ranked by relevance.`;

export type ExistingCard = {
  name: string;
  description?: string;
  priority?: Priority;
};

export type GeneratePlanInput = {
  context: string;
  count: number;
  existingCards?: ExistingCard[];
};

/** Augmented task shape that the planner returns to the UI. */
export type PlannerTask = SampleTask & {
  suggestedTime: string;
  day: number; // 0..6 Mon..Sun
  start: number; // 0..23
  duration: number; // hours
};

export type GeneratePlanResult = {
  source: "deepseek" | "stub";
  tasks: PlannerTask[];
  note?: string;
};

const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

export async function generatePlan({
  context,
  count,
  existingCards = [],
}: GeneratePlanInput): Promise<GeneratePlanResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const safeCount = Math.min(Math.max(count, 1), 10);

  // No saved cards → no suggestions. The whole point is to rank what the
  // user has already curated. Surface a clear note instead of inventing.
  if (existingCards.length === 0) {
    return {
      source: "stub",
      tasks: [],
      note: "No saved cards yet — add a few cards first, then generate suggestions.",
    };
  }

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const tasks = await callDeepSeek(
        apiKey,
        context,
        safeCount,
        existingCards,
      );
      return { source: "deepseek", tasks };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown DeepSeek error";
      // Fall back to the stub but flag the failure so the UI can show it.
      return {
        source: "stub",
        tasks: stubPlan(context, safeCount, existingCards),
        note: `DeepSeek call failed (${message}); using local ranking fallback.`,
      };
    }
  }

  return {
    source: "stub",
    tasks: stubPlan(context, safeCount, existingCards),
    note: "DEEPSEEK_API_KEY not set — using local ranking fallback.",
  };
}

async function callDeepSeek(
  apiKey: string,
  context: string,
  count: number,
  existingCards: ExistingCard[],
): Promise<PlannerTask[]> {
  const cardsBlob = existingCards
    .map(
      (c, i) =>
        `${i + 1}. name: "${c.name}"; description: "${c.description ?? ""}"; priority: ${c.priority ?? "medium"}`,
    )
    .join("\n");

  const userPrompt =
    `Student message:\n"""\n${context}\n"""\n\n` +
    `Existing saved cards (the ONLY pool you may pick from):\n${cardsBlob}\n\n` +
    `Pick the top ${count} cards from the list above (or all of them if fewer than ${count}), ranked by how directly they address the student message. ` +
    `Rephrase name/description if it makes them clearer, write a fresh recommendReason for each that explicitly ties back to the student message, and propose a concrete time slot via suggestedTime + day + start + duration.`;

  const r = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      // DeepSeek (OpenAI-compatible) supports JSON mode via response_format.
      // This greatly increases the chances of getting parseable JSON back.
      response_format: { type: "json_object" },
      max_tokens: 1800,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`DeepSeek ${r.status}: ${body.slice(0, 200)}`);
  }

  const data = (await r.json()) as {
    choices?: Array<{
      message?: { content?: string };
    }>;
  };

  const text = (data.choices?.[0]?.message?.content ?? "").trim();
  if (!text) {
    throw new Error("Empty response from DeepSeek");
  }

  // Extract the first {...} block in case the model added stray prose.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("No JSON object in model response");
  }

  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  const validated = ResponseSchema.parse(parsed);
  // SampleTask has a `datetime` field for back-compat — fill it as empty.
  return validated.tasks.slice(0, count).map((t) => ({
    name: t.name,
    description: t.description,
    recommendReason: t.recommendReason,
    priority: t.priority,
    datetime: "",
    suggestedTime: t.suggestedTime,
    day: t.day,
    start: t.start,
    duration: t.duration,
  }));
}

/**
 * Deterministic fallback: rank the user's existing cards by how well they
 * match the message, take the top `count`. We never invent cards.
 */
function stubPlan(
  context: string,
  count: number,
  existingCards: ExistingCard[],
): PlannerTask[] {
  const ctx = context.toLowerCase();

  const stressed =
    /stress|overwhelm|tired|exhaust|anxious|burnout|panic|累|压力|焦虑/.test(
      ctx,
    );
  const examPressure =
    /exam|midterm|final|deadline|due|quiz|考试|作业|deadline/.test(ctx);
  const social = /friend|group|team|partner|朋友|小组/.test(ctx);

  // Tokens (≥3 chars) from the message — used for keyword overlap scoring.
  const tokens = Array.from(
    new Set(ctx.split(/[^a-z0-9一-龥]+/i).filter((w) => w.length >= 3)),
  );

  const score = (c: ExistingCard): number => {
    let s = 0;
    const blob = `${c.name} ${c.description ?? ""}`.toLowerCase();
    if (stressed && /(walk|sleep|break|stress|reset|rest|寝|休息|散步)/.test(blob))
      s += 3;
    if (
      examPressure &&
      /(deadline|due|problem set|lab|essay|reflection|outline|exam|study|review)/.test(
        blob,
      )
    )
      s += 3;
    if (social && /(group|study group|friend|presentation|partner)/.test(blob))
      s += 2;
    for (const tok of tokens) if (blob.includes(tok)) s += 1;
    s += priorityWeight(c.priority ?? "medium");
    return s;
  };

  return [...existingCards]
    .sort((a, b) => score(b) - score(a))
    .slice(0, count)
    .map((c, i) => {
      const slot = pickSlot(c, i);
      return {
        name: c.name,
        description:
          c.description && c.description.trim().length > 0
            ? c.description
            : `Make progress on "${c.name}".`,
        datetime: "",
        recommendReason: buildReason(c, { stressed, examPressure, social, ctx }),
        priority: c.priority ?? "medium",
        suggestedTime: formatSlot(slot.day, slot.start, slot.duration),
        day: slot.day,
        start: slot.start,
        duration: slot.duration,
      };
    });
}

/** Spread fallback slots across the next few days at sensible study hours. */
function pickSlot(c: ExistingCard, i: number) {
  const blob = `${c.name} ${c.description ?? ""}`.toLowerCase();
  const isWellbeing = /(walk|sleep|break|rest|stress|reset)/.test(blob);
  // Mon..Fri rotation; cap at 5 → keep weekends free for fallback.
  const day = i % 5;
  // Wellbeing slots → short, evening. Academic → 1.5 h, afternoon.
  if (isWellbeing) {
    return { day, start: 18 + (i % 2), duration: 0.5 };
  }
  const startOptions = [9, 11, 14, 16];
  const start = startOptions[i % startOptions.length] ?? 14;
  return { day, start, duration: 1.5 };
}

function formatSlot(day: number, start: number, duration: number): string {
  const dayName = DAY_NAMES[day] ?? "Mon";
  const hh = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${(h % 1) * 60 === 0 ? "00" : String((h % 1) * 60).padStart(2, "0")}`;
  return `${dayName} ${hh(start)}–${hh(start + duration)}`;
}

function buildReason(
  c: ExistingCard,
  flags: { stressed: boolean; examPressure: boolean; social: boolean; ctx: string },
): string {
  const blob = `${c.name} ${c.description ?? ""}`.toLowerCase();
  if (flags.stressed && /(walk|sleep|break|rest|stress|reset)/.test(blob))
    return "You mentioned feeling tired — a wellbeing item like this resets your focus.";
  if (flags.examPressure && /(deadline|due|exam|study|review|problem set|lab|essay)/.test(blob))
    return "Directly addresses the deadline pressure you described.";
  if (flags.social && /(group|friend|presentation|partner)/.test(blob))
    return "Connected to the people / group work you mentioned.";
  // Even when nothing matches, still tie back to the user's message.
  const snippet = flags.ctx.trim().slice(0, 60);
  return snippet
    ? `Aligned with what you just said: "${snippet}${flags.ctx.length > 60 ? "…" : ""}".`
    : "Picked from your saved cards as a sensible next step.";
}

// suppress unused-import warning when sampleTasks is no longer referenced
void sampleTasks;

function priorityWeight(p: Priority): number {
  return p === "high" ? 2 : p === "medium" ? 1 : 0;
}
