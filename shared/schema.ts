import { z } from "zod";

/**
 * Audit Log Schema - using Zod for validation
 * Note: This app uses in-memory storage (MemStorage), not a database
 */

export const insertAuditLogSchema = z.object({
  username: z.string(),
  filesProcessed: z.number(),
  recordsProcessed: z.number(),
  validationErrors: z.number(),
  phase: z.string(),
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export interface AuditLog extends InsertAuditLog {
  id: string;
  timestamp: Date;
}
