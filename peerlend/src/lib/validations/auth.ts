import { z } from "zod";

// Robust Regex Patterns
const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * Common validation rules to avoid duplication
 */
export const emailSchema = z
    .string()
    .min(1, "Please enter the valid email")
    .email("Please enter the valid email")
    .refine((val) => {
        const parts = val.split("@");
        if (parts.length !== 2) return false;
        const domain = parts[1];
        return domain.includes(".") && domain.lastIndexOf(".") > 0 && domain.split(".").pop()!.length >= 2;
    }, {
        message: "Please enter the valid email",
    });

export const passwordSchema = z
    .string()
    .min(8, "Your password must be at least 8 characters long")
    .regex(passwordRegex, "For security, include at least one letter and one number");

export const phoneSchema = z
    .string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Please enter a valid 10-digit mobile number (e.g., 9876543210)");

export const pincodeSchema = z
    .string()
    .min(1, "Pincode is required")
    .regex(pincodeRegex, "Please enter a valid 6-digit area pincode");

/**
 * Login Schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Please enter your password"),
});

/**
 * Signup Schemas (Split by steps)
 */
export const signupStep0Schema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

export const signupStep1Schema = z.object({
    fullName: z.string().min(3, "Please enter your full name (at least 3 characters)"),
    phone: phoneSchema,
    dob: z.string().min(1, "Please select your date of birth"),
    gender: z.enum(["male", "female", "other"], {
        message: "Please select your gender to continue",
    }),
});

export const signupStep2Schema = z.object({
    occupation: z.string().min(2, "Please tell us your occupation"),
    monthlyIncome: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Please enter a valid monthly income amount",
    }),
    role: z.enum(["borrower", "lender"], {
        message: "Please select whether you want to borrow or invest",
    }),
});

export const signupStep3Schema = z.object({
    address: z.string().min(5, "Please enter your full residential address"),
    city: z.string().min(2, "Please enter your city name"),
    state: z.string().min(2, "Please enter your state name"),
    pincode: pincodeSchema,
});

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupStep0Data = z.infer<typeof signupStep0Schema>;
export type SignupStep1Data = z.infer<typeof signupStep1Schema>;
export type SignupStep2Data = z.infer<typeof signupStep2Schema>;
export type SignupStep3Data = z.infer<typeof signupStep3Schema>;
