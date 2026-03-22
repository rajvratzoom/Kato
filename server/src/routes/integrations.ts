import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Get all integrations
router.get('/', (_req: Request, res: Response) => {
  const integrations = db.prepare('SELECT * FROM integrations').all();
  // Get agent mappings for each
  const enriched = integrations.map((i: any) => {
    const agents = db.prepare(`
      SELECT a.id, a.name, a.avatar, ai.enabled
      FROM agents a
      JOIN agent_integrations ai ON a.id = ai.agent_id
      WHERE ai.integration_id = ?
    `).all(i.id);
    return { ...i, agents };
  });
  res.json(enriched);
});

// Toggle integration status
router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['connected', 'disconnected'].includes(status)) {
    res.status(400).json({ error: 'Status must be "connected" or "disconnected"' });
    return;
  }
  db.prepare('UPDATE integrations SET status = ? WHERE id = ?').run(status, req.params.id);
  const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(req.params.id);
  res.json(integration);
});

// Toggle agent-integration mapping
router.patch('/:integrationId/agent/:agentId', (req: Request, res: Response) => {
  const { enabled } = req.body;
  db.prepare(
    'UPDATE agent_integrations SET enabled = ? WHERE agent_id = ? AND integration_id = ?'
  ).run(enabled ? 1 : 0, req.params.agentId, req.params.integrationId);
  res.json({ success: true });
});

export default router;
