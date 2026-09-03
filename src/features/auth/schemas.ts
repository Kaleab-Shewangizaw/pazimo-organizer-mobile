import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// Ethiopian phone numbers as accepted elsewhere in the Pazimo backend
// (09xxxxxxxx / 07xxxxxxxx, optionally with a +251 country code).
const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;

export const organizerAccountSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid Ethiopian phone number, e.g. 0912345678"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type OrganizerAccountValues = z.infer<typeof organizerAccountSchema>;

export const organizerOrgSchema = z.object({
  organization: z.string().trim().min(2, "Enter your organization name"),
  organizerType: z.string().trim().min(1, "Select what best describes you"),
});
export type OrganizerOrgValues = z.infer<typeof organizerOrgSchema>;

export const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

// Matches backend/src/controllers/authController.js's findUserByIdentifier:
// anything with an "@" is treated as an email, everything else as a phone
// number.
export const identifierSchema = z
  .string()
  .trim()
  .min(1, "Enter your email or phone number")
  .refine(
    (value) => (value.includes("@") ? z.string().email().safeParse(value).success : phoneRegex.test(value)),
    "Enter a valid email or Ethiopian phone number",
  );

// Backend's resetPasswordWithCode requires >= 6 characters — a lower bar
// than sign-up's 8, so match it exactly rather than reusing that schema.
export const newPasswordSchema = z.string().min(6, "Password must be at least 6 characters");
