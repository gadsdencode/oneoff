import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
}).pick({
  email: true,
  password: true,
  username: true,
  firstName: true,
  lastName: true,
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
export type OAuthUser = z.infer<typeof oauthUserSchema>;
export type User = typeof users.$inferSelect;
export type PublicUser = z.infer<typeof publicUserSchema>;
