import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { insertAuditLogSchema } from '@shared/schema';

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/audit/log', async (req, res) => {
    try {
      const validatedData = insertAuditLogSchema.parse(req.body);
      const auditLog = await storage.createAuditLog(validatedData);
      res.json(auditLog);
    } catch (error) {
      res.status(400).json({ error: 'Invalid audit log data' });
    }
  });

  app.get('/api/audit/logs', async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await storage.getAuditLogs(limit);
    res.json(logs);
  });

  app.get('/api/audit/logs/:username', async (req, res) => {
    const logs = await storage.getAuditLogsByUsername(req.params.username);
    res.json(logs);
  });

  const httpServer = createServer(app);

  return httpServer;
}
