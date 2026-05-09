import { z } from "zod";

export const taskSchema = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be less than 100 characters"),
    description: z
        .string()
        .trim()
        .transform((val) => (val === "" ? undefined : val))
        .optional()
        .pipe(z.string().min(3, "Description must be at least 3 characters").max(2000, "Description must be less than 2000 characters").optional()),
    priorityIds: z.array(z.string()).default([]),
    assigneeIds: z.array(z.string()).default([]),
    dueDate: z.date({ invalid_type_error: "Invalid date" }).nullable().default(null),
    cost: z
        .string()
        .trim()
        .transform((val) => (val === "" ? undefined : val))
        .optional()
        .pipe(
            z
                .string()
                .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
                    message: "Cost must be a positive number",
                })
                .refine((val) => parseFloat(val) <= 1_000_000, {
                    message: "Cost must be less than 1,000,000",
                })
                .optional(),
        ),
});
