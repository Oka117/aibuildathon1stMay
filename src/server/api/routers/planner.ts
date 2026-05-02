import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { sampleTasks } from "~/server/data/sample-data";
import { generatePlan } from "~/server/lib/ai";

/**
 * Planner router — bridges the UI to the AI plan generator.
 *
 *   - `generate`    Mutation. Takes free-text context and returns a list of
 *                   suggested tasks (shape = SampleTask). Frontend then chooses
 *                   which to commit via `card.create`.
 *   - `getSamples`  Query. Returns the seeded sample tasks for the
 *                   "See sample plan" button (no AI call needed).
 */
export const plannerRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        context: z
          .string()
          .min(1, "Tell us a bit about your week first")
          .max(2000),
        count: z.number().int().min(1).max(10).default(5),
      }),
    )
    .mutation(({ input }) => generatePlan(input)),

  getSamples: publicProcedure.query(() => sampleTasks),
});
