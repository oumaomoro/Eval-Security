import { z } from "zod";

/**
 * Phase 33: Hardened Enterprise Authentication Schemas
 * Implements strict type checking and constraint validation for all auth-related inputs.
 */

export const loginSchema = z.object({
  email: z.string().email("A valid enterprise email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registrationSchema = z.object({
  email: z.string().email("A valid enterprise email is required."),
  password: z.string()
    .min(10, "Password must be at least 10 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
  firstName: z.string().min(1, "First name is required.").max(50),
  lastName: z.string().min(1, "Last name is required.").max(50),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter the email associated with your account."),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(10, "Password must be at least 10 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
});

export const apiKeySchema = z.string().regex(/^sk-[a-f0-9]{48}$/, "Invalid API key format.");

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
