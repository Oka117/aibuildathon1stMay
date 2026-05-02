/**
 * Sample seed data for the StudyFlow prototype.
 *
 * Two layers of sample data live here:
 *
 *   1. `sampleTasks` — the original SampleTask shape (name / description /
 *      datetime / recommendReason / priority). Kept for the AI fallback
 *      and the planner's "see sample plan" affordance.
 *
 *   2. `sampleCards` — richer seed used by `cardStore.seedIfEmpty()` so the
 *      Tasks list and Planner pages have realistic CS coursework cards on
 *      first load. Each card carries a tag (course code), cover background,
 *      and pomotodo-style metadata so the new UI can render directly off it.
 *
 * Used by:
 *   - the AI fallback in src/server/lib/ai.ts (sampleTasks → ranked plan)
 *   - cardStore.seedIfEmpty() in src/server/data/store.ts (sampleCards)
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

/**
 * Cover gradient palette for the pomotodo-style cards. Each entry maps to
 * a Tailwind gradient and a subtle icon hue. We deliberately keep the set
 * small so the list looks cohesive on first paint.
 */
export type CoverKey =
  | "skyline"
  | "mountain"
  | "campus"
  | "night"
  | "library"
  | "ocean"
  | "forest";

export type SampleCard = {
  /** Display name (Chinese-friendly, matching the pomotodo aesthetic). */
  name: string;
  /** 1–2 sentence English description for the AI / table views. */
  description: string;
  /** Course code or category tag — e.g. "COMP4610", "Wellbeing". */
  tag: string;
  /** Which cover the card uses. */
  cover: CoverKey;
  /** Priority for downstream sorting. */
  priority: Priority;
  /** Optional ISO-like datetime — purely informational on the Tasks page. */
  datetime?: string;
  /** Optional recommend reason carried from the planner concept. */
  recommendReason?: string;
};

/* -------------------------------------------------------------------------
 * 1. Original SampleTask shape — used by the AI fallback in src/server/lib/ai.ts
 * ------------------------------------------------------------------------- */

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
    name: "Finish COMP3242 Studio prep",
    description:
      "Skim the Workshop 06 brief and write down the three questions you want to ask in lab.",
    datetime: "2026-05-05 14:00",
    recommendReason:
      "You said the Studio brief feels overwhelming — pre-reading defuses Wednesday lab anxiety.",
    priority: "high",
  },
  {
    name: "COMP2620 Logic — proof set q1–3",
    description:
      "Tackle natural-deduction proofs 1–3 first to build momentum before the harder ones.",
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
    name: "Email Prof. Lee about COMP4610 extension",
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
    name: "Read COMP3900 capstone brief",
    description:
      "Skim the project handout, highlight the three deliverables, list two questions for the supervisor.",
    datetime: "2026-05-07 20:00",
    recommendReason:
      "Capstone proposal is due Friday — 40 min Thursday is plenty if you don't perfect it.",
    priority: "medium",
  },
  {
    name: "Plan weekend revision blocks",
    description:
      "Book 2× 60-min blocks Saturday morning. Pick which CS course before you sit down.",
    datetime: "2026-05-08 21:00",
    recommendReason:
      "Pre-deciding what to study removes the Saturday-morning decision tax.",
    priority: "low",
  },
  {
    name: "Sleep by 11 PM tonight",
    description:
      "Stop coding at 10:30, screens off by 10:45, lights off at 11:00.",
    datetime: "2026-05-04 22:30",
    recommendReason:
      "Your average bedtime drifted to 1:15 AM this week — one earlier night recovers a lot.",
    priority: "high",
  },
  {
    name: "Group presentation — slide outline",
    description:
      "Just the slide titles and one bullet each for COMP3242 Studio. No design polish yet.",
    datetime: "2026-05-06 15:00",
    recommendReason:
      "An outline unblocks your group. Polishing slides without an outline wastes hours.",
    priority: "medium",
  },
  {
    name: "Office hours — Calculus / discrete maths",
    description:
      "Bring problem set q4 and the spot you got stuck on Tuesday.",
    datetime: "2026-05-05 10:00",
    recommendReason:
      "20 min with the tutor saves 2 h of solo confusion. Free; you've already paid for it.",
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

/* -------------------------------------------------------------------------
 * 2. Pomotodo-style seed cards — used by cardStore.seedIfEmpty()
 *    These power the Tasks page list shown in the new UI.
 * ------------------------------------------------------------------------- */

export const sampleCards: SampleCard[] = [
  {
    name: "COMP4610 — AI",
    description:
      "Re-read the transformer attention chapter and sketch the key diagrams in your own words.",
    tag: "COMP4610",
    cover: "skyline",
    priority: "high",
    datetime: "2026-05-04 09:00",
    recommendReason:
      "Tomorrow's tutorial builds on this — 25 min now beats 2 h of catch-up Thursday night.",
  },
  {
    name: "COMP3242 — Studio",
    description:
      "Workshop 06 prep: skim the brief and write the three questions you want to ask in lab.",
    tag: "COMP3242",
    cover: "mountain",
    priority: "high",
    datetime: "2026-05-05 14:00",
    recommendReason:
      "Pre-reading defuses Wednesday lab anxiety.",
  },
  {
    name: "COMP2620 — Logic",
    description:
      "Natural-deduction proof set: do questions 1–3 first to build momentum.",
    tag: "COMP2620",
    cover: "campus",
    priority: "medium",
    datetime: "2026-05-06 19:00",
    recommendReason: "Due Monday — splitting it across two evenings keeps stress low.",
  },
  {
    name: "COMP3900 — Capstone",
    description:
      "Skim the project handout, highlight the three deliverables, list two questions for the supervisor.",
    tag: "COMP3900",
    cover: "night",
    priority: "medium",
    datetime: "2026-05-07 20:00",
    recommendReason: "Capstone proposal is due Friday — 40 min now is plenty.",
  },
  {
    name: "Study group — Logic proofs",
    description:
      "Library Room 3 with Sam and Priya. Bring questions from last week's quiz.",
    tag: "COMP2620",
    cover: "library",
    priority: "medium",
    datetime: "2026-05-05 16:00",
    recommendReason:
      "Talking proofs out loud is the highest-yield study mode for this course.",
  },
  {
    name: "Walk · Sullivans Creek",
    description:
      "30-minute walk with phone on Do Not Disturb. Notice three things you can hear.",
    tag: "Wellbeing",
    cover: "forest",
    priority: "medium",
    datetime: "2026-05-04 17:30",
    recommendReason:
      "Your stress trended high yesterday — short walks reset focus better than scrolling.",
  },
  {
    name: "Sleep by 11 PM",
    description: "Stop coding at 10:30, screens off by 10:45, lights off at 11:00.",
    tag: "Wellbeing",
    cover: "ocean",
    priority: "high",
    datetime: "2026-05-04 22:30",
    recommendReason:
      "Your average bedtime drifted to 1:15 AM — one earlier night recovers a lot.",
  },
];
