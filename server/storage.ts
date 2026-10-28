import { type AuditLog, type InsertAuditLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUsername(username: string): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private auditLogs: Map<string, AuditLog>;

  constructor() {
    this.auditLogs = new Map();
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = { 
      ...insertLog, 
      id,
      timestamp: new Date()
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getAuditLogsByUsername(username: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.username === username)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
