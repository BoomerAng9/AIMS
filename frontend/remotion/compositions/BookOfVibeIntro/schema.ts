import { z } from "zod";

export const bookOfVibeIntroSchema = z.object({
  /** Chapter subtitle shown at the end */
  subtitle: z.string(),
  /** Show the "Activity Breeds Activity" doctrine */
  showDoctrine: z.boolean(),
});

export type BookOfVibeIntroProps = z.infer<typeof bookOfVibeIntroSchema>;
