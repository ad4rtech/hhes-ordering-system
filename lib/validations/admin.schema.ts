import { z } from "zod";
export const inviteAdminSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
});