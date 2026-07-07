import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trialSettingsTable = pgTable("trial_settings", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(false),
  trialDays: integer("trial_days").notNull().default(7),
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTrialSettingsSchema = createInsertSchema(trialSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrialSettings = z.infer<typeof insertTrialSettingsSchema>;
export type TrialSettings = typeof trialSettingsTable.$inferSelect;
