import { z } from "zod";

export const CONTACT_TOPICS = [
  { value: "registration", label: "Registration and approval" },
  { value: "ordering", label: "Placing or changing an order" },
  { value: "payments", label: "M-Pesa payments" },
  { value: "refunds", label: "Refunds" },
  { value: "pickup", label: "Pickup and collection" },
  { value: "account", label: "Account and password" },
  { value: "other", label: "Something else" },
] as const;

export const TOPIC_VALUES = CONTACT_TOPICS.map((t) => t.value) as unknown as [string, ...string[]];
export const topicLabel = (v: string) => CONTACT_TOPICS.find((t) => t.value === v)?.label ?? v;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100, "Use 100 characters or fewer"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: z.string().trim().max(30).regex(/^(\+?[\d\s-]{7,20})?$/, "Enter a valid phone number"),
  organisation: z.string().trim().max(150, "Use 150 characters or fewer"),
  topic: z.enum(TOPIC_VALUES, { message: "Choose what your message is about" }),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000, "Please keep it under 2,000 characters"),
});
export type ContactValues = z.infer<typeof contactSchema>;