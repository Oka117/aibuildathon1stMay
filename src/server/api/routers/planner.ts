import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { sampleTasks } from "~/server/data/sample-data";
import { cardStore } from "~/server/data/store";
import { generatePlan } from "~/server/lib/ai";

/**
 * Planner router — bridges the UI to the AI plan generator.
 *
 *   - `generate`    Mutation. Takes free-text context plus the user's saved
 *                   cards (pulled from the in-memory store) and returns a
 *                   ranked subset of those cards as suggestions. The AI is
 *                   constrained to pick from existing cards only; it must
 *                   not invent new tasks.
 *   - `getSamples`  Query. Returns the seeded sample tasks (no AI call).
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
    .mutation(({ input }) => {
      // Pull all currently-saved (not-done) cards from the in-memory store
      // and pass them as the candidate pool the AI must rank.
      const existingCards = cardStore
        .list()
        .filter((c) => !c.done)
        .map((c) => ({
          name: c.name,
          description: c.description,
          priority: c.priority,
        }));

      return generatePlan({ ...input, existingCards });
    }),

  getSamples: publicProcedure.query(() => sampleTasks),
});
