/**
 * Sample task list for the StudyFlow "Overwhelmed Student" prototype.
 *
 * Schema (declared by the brief):
 *   - name             — short, action-oriented title
 *   - description      — 1–2 sentences of detail
 *   - datetime         — ISO-like string "YYYY-MM-DD HH:MM" (local)
 *   - recommendReason  — why this task is being recommended now
 *   - priority         — "high" | "medium" | "low"
 *
 * Used by:
 *   - the AI fallback in src/server/lib/ai.ts (when ANTHROPIC_API_KEY is unset)
 *   - the Planner page's "See sample plan" button
 *   - any future seed routine
 */

export type Priority = "high" | "medium" | "low";

export type SampleTask = {
  name: string;
  description: string;
  datetime: string;
  recommendReason: string;
  priority: Priority;
};

export const sampleTasks: SampleTask[] = [
  {
    name: "Review COMP4610 Lecture 3 notes",
    description:
      "Re-read the chapter on transformer attention; sketch the key diagrams in your own words.",
    datetime: "2026-05-04 09:00",
    recommendReason:
      "Tomorrow's tutorial builds on this — 25 min now beats 2 h of catching up Thursday night.",
    priority: "high",
  },
  {
    name: "Draft Lab Report introduction",
    description:
      "Write the first 200 words: research question, hypothesis, why it matters.",
    datetime: "2026-05-05 14:00",
    recommendReason:
      "You said the lab report feels overwhelming — starting with just the intro breaks the freeze.",
    priority: "high",
  },
  {
    name: "Problem Set 5 — questions 1–3",
    description:
      "Tackle the easier integration problems first to build momentum before the harder ones.",
    datetime: "2026-05-06 19:00",
    recommendReason:
      "Due Monday. Splitting Wed (q1–3) + Sun (q4–5) keeps weekend stress low.",
    priority: "medium",
  },
  {
    name: "30-minute walk around Sullivans Creek",
    description: "Phone on Do Not Disturb. Notice three things you can hear.",
    datetime: "2026-05-04 17:30",
    recommendReason:
      "Your stress level trended high yesterday — short walks reset focus better than scrolling.",
    priority: "medium",
  },
  {
    name: "Email Prof. Lee about extension",
    description:
      "Two-sentence draft: ask for an extra 48 h on the Reading Reflection, give a brief reason.",
    datetime: "2026-05-04 11:00",
    recommendReason:
      "Sending early reads as professional; waiting until the night-of looks panicky.",
    priority: "high",
  },
  {
    name: "Study group — COMP2620 Logic",
    description:
      "Library Room 3 with Sam and Priya. Bring questions from last week's quiz.",
    datetime: "2026-05-05 16:00",
    recommendReason:
      "Talking proofs out loud is the highest-yield study mode for this course.",
    priority: "medium",
  },
  {
    name: "Read Chapter 4 — HIST 200",
    description:
      "Skim first, then re-read the sections highlighted in lecture. Aim for 40 min, not perfection.",
    datetime: "2026-05-07 20:00",
    recommendReason:
      "Reading reflection is due Friday — 40 min Thursday is plenty if you don't perfect it.",
    priority: "medium",
  },
  {
    name: "Plan weekend revision blocks",
    description:
      "Book 2× 60-min blocks Saturday morning. Pick which course before you sit down.",
    datetime: "2026-05-08 21:00",
    recommendReason:
      "Pre-deciding what to study removes the Saturday-morning decision tax.",
    priority: "low",
  },
  {
    name: "Sleep by 11 PM tonight",
    description:
      "Stop studying at 10:30, screens off by 10:45, lights off at 11:00.",
    datetime: "2026-05-04 22:30",
    recommendReason:
      "Your average bedtime drifted to 1:15 AM this week — one earlier night recovers a lot.",
    priority: "high",
  },
  {
    name: "Group presentation — slide outline",
    description:
      "Just the slide titles and one bullet each. No design polish yet.",
    datetime: "2026-05-06 15:00",
    recommendReason:
      "An outline unblocks your group. Polishing slides without an outline wastes hours.",
    priority: "medium",
  },
  {
    name: "Office hours — Calculus",
    description:
      "Bring problem set q4 and the spot you got stuck on Tuesday.",
    datetime: "2026-05-05 10:00",
    recommendReason:
      "20 min with the lecturer saves 2 h of solo confusion. Free; you've already paid for it.",
    priority: "medium",
  },
  {
    name: "Reply to study-group chat",
    description: "Confirm Thursday, ask if Sam can bring the cheat sheet.",
    datetime: "2026-05-04 12:30",
    recommendReason: "Two minutes now keeps the group running smoothly.",
    priority: "low",
  },
];
