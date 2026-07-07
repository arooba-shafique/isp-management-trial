import { Request, Response, NextFunction } from "express";
import { db, trialSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function checkTrialExpired(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [settings] = await db.select().from(trialSettingsTable).limit(1);
    
    // No settings or trial never started = site works
    if (!settings || !settings.trialStart) {
      next();
      return;
    }

    // Trial was started but then stopped = site blocked
    if (!settings.isActive) {
      res.status(403).json({ 
        error: "Trial has been stopped",
        trialStopped: true
      });
      return;
    }

    // Trial is active - check if expired
    const now = new Date();
    if (settings.trialEnd && now > settings.trialEnd) {
      res.status(403).json({ 
        error: "Trial period has expired",
        trialExpired: true,
        trialEnd: settings.trialEnd
      });
      return;
    }

    next();
  } catch {
    // If trial_settings table doesn't exist or any error, just skip the check
    next();
  }
}

export async function getTrialStatus(): Promise<{
  isActive: boolean;
  isStopped: boolean;
  daysRemaining: number | null;
  trialEnd: Date | null;
  isExpired: boolean;
}> {
  try {
    const [settings] = await db.select().from(trialSettingsTable).limit(1);
    
    // No settings or trial never started
    if (!settings || !settings.trialStart) {
      return { isActive: false, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    // Trial was started but stopped
    if (!settings.isActive) {
      return { isActive: false, isStopped: true, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    // Trial is active
    const now = new Date();
    const trialEnd = settings.trialEnd;
    
    if (!trialEnd) {
      return { isActive: true, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    const isExpired = now > trialEnd;
    const diffMs = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return { isActive: true, isStopped: false, daysRemaining, trialEnd, isExpired };
  } catch {
    return { isActive: false, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false };
  }
}
