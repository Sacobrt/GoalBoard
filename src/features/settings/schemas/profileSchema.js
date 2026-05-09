import { z } from "zod";

const optionalUrl = z
    .string()
    .trim()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .pipe(z.string().url("Please enter a valid URL (e.g. https://example.com)").optional());

export const profileSchema = z.object({
    username: z
        .string({ required_error: "Username is required" })
        .trim()
        .min(2, "Username must be at least 2 characters")
        .max(30, "Username must be less than 30 characters")
        .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, hyphens, and dots"),
    fullName: z.string().trim().max(100, "Full name must be less than 100 characters").optional().default(""),
    bio: z.string().trim().max(300, "Bio must be less than 300 characters").optional().default(""),
    website: optionalUrl,
    location: z.string().trim().max(100, "Location must be less than 100 characters").optional().default(""),
    organization: z.string().trim().max(100, "Organization must be less than 100 characters").optional().default(""),
    jobTitle: z.string().trim().max(100, "Job title must be less than 100 characters").optional().default(""),
    education: z.string().trim().max(100, "Education must be less than 100 characters").optional().default(""),
});
