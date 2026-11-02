import "server-only";
import { db } from "./db";

export async function audit(actorId: string, action: string, targetType: string, targetId: string, details = "") {
  await db.auditLog.create({ data: { actorId, action, targetType, targetId, details: details.slice(0, 1000) } });
}
