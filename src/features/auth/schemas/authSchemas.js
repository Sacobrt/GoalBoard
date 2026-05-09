import { z } from "zod";

export const registerSchema = z
    .object({
        username: z
            .string({ required_error: "Username is required" })
            .trim()
            .min(2, "Username must be at least 2 characters")
            .max(30, "Username must be less than 30 characters")
            .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, hyphens, and dots"),
        fullName: z.string().trim().max(100, "Full name must be less than 100 characters").optional().default(""),
        email: z.string({ required_error: "Email is required" }).trim().min(1, "Email is required").email("Please enter a valid email address"),
        password: z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters")
            .max(128, "Password must be less than 128 characters"),
        confirm: z.string({ required_error: "Please confirm your password" }).min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirm, {
        message: "Passwords do not match",
        path: ["confirm"],
    });

export const loginSchema = z.object({
    email: z.string({ required_error: "Email is required" }).trim().min(1, "Email is required").email("Please enter a valid email address"),
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});
