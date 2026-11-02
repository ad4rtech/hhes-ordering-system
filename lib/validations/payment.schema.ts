import { z } from "zod";
import { mpesaPhoneSchema } from "./organisation.schema";

export const stkPushSchema = z.object({
  order_id: z.string().uuid(),
  phone: mpesaPhoneSchema.optional(), // pre-filled from the saved number when there is one
  save_phone: z.boolean().optional(),  // "use this number next time"
});