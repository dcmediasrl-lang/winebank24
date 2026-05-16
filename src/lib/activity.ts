import { db } from "@/lib/db";

export type ActivityAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER"
  | "EMAIL_VERIFIED"
  | "PASSWORD_CHANGED"
  | "2FA_ENABLED"
  | "2FA_DISABLED"
  | "NFT_PURCHASED"
  | "NFT_SOLD"
  | "FRACTION_PURCHASED"
  | "FRACTION_LISTED"
  | "BURN_REQUESTED"
  | "KYC_SUBMITTED"
  | "KYC_COMPLETED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED";

export async function logActivity(
  userId: string,
  action: ActivityAction,
  details?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.activityLog.create({
      data: { userId, action, details, ipAddress, userAgent },
    });
  } catch {
    // Never let logging failures break the main flow
    console.error("[activity] Failed to log activity:", action, userId);
  }
}
