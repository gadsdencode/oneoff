import { pgTable, text, serial, integer, boolean, timestamp, date, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session table for express-session with connect-pg-simple
// Matching the exact structure created by connect-pg-simple
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(), // JSON session data
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").unique(), // Make username optional for OAuth users
  password: text("password"), // Optional for OAuth-only users
  emailVerified: boolean("email_verified").default(false),
  
  // OAuth fields
  googleId: text("google_id").unique(),
  
  // Profile information
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"), // URL to profile picture
  age: integer("age"),
  dateOfBirth: date("date_of_birth"),
  bio: text("bio"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for creating a user with email/password
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  age: z.number().int().min(13, "Must be at least 13 years old").max(120, "Invalid age").optional(),
  dateOfBirth: z.string().optional(), // Will be converted to Date
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
}).pick({
  email: true,
  password: true,
  username: true,
  firstName: true,
  lastName: true,
  age: true,
  dateOfBirth: true,
  bio: true,
});

// Schema for user registration with email/password
export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});

// Schema for user login
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Schema for user profile updates
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  age: z.number().int().min(13, "Must be at least 13 years old").max(120, "Invalid age").optional(),
  dateOfBirth: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, "Invalid date of birth"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

// Schema for OAuth user creation
export const oauthUserSchema = z.object({
  email: z.string().email(),
  googleId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().url().optional(),
  emailVerified: z.boolean().default(true), // OAuth emails are typically verified
});

// Public user schema (without sensitive data)
export const publicUserSchema = createSelectSchema(users).omit({
  password: true,
  googleId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type OAuthUser = z.infer<typeof oauthUserSchema>;
export type User = typeof users.$inferSelect;
export type PublicUser = z.infer<typeof publicUserSchema>;
