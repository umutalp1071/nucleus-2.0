import { WeeklyReviewSchema, type WeeklyReview, type Observation, type NucleusEvent } from "@/lib/domain";
import type { TaskDef } from "./index";

export { WeeklyReviewSchema };
export type { WeeklyReview };

interface WeeklyReviewInput {
  ventureTitle: string;
  killCriteria: string;
  observations: Observation[];
  events: NucleusEvent[];
}

// Summarizes data it's already given -- no reasoning depth needed, so tier
// "cheap" and no chain-of-thought padding. Manual trigger only, no cron. See
// docs/plan/PHASE-09-growth-stage.md.
export const weeklyReview: TaskDef<WeeklyReviewInput, WeeklyReview> = {
  name: "weekly-review",
  tier: "cheap",
  minTier: "cheap",
  expectedOutTokens: 400,
  schema: WeeklyReviewSchema,
  prompt(input) {
    return `Summarize the last 7 days for "${input.ventureTitle}". Be direct, no padding.

Kill criteria the founder set at planning time: ${input.killCriteria}

Manual metric entries from the last 7 days: ${JSON.stringify(input.observations)}
Events from the last 7 days: ${JSON.stringify(input.events)}

Respond with ONLY valid JSON matching this exact shape:
{
  "whatMoved": string,
  "whatDidnt": string,
  "recommendedAction": string,
  "killCriteriaCheck": string (an honest read against the kill criteria above, given the actual numbers)
}`;
  },
};
