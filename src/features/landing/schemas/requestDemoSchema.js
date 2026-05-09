import { z } from "zod";

export const requestDemoSchema = z.object({
    name: z
        .string({ required_error: "Full name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters"),
    email: z.string({ required_error: "Email is required" }).trim().min(1, "Email is required").email("Please enter a valid email address"),
    company: z.string().trim().max(100, "Company name must be less than 100 characters").optional().default(""),
    message: z
        .string()
        .trim()
        .transform((val) => (val === "" ? undefined : val))
        .optional()
        .pipe(z.string().max(1000, "Message must be less than 1000 characters").optional()),
});
