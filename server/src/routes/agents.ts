import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Get live agent status for sidebar pills
router.get('/status', (_req: Request, res: Response) => {
  const agents = db.prepare(
    'SELECT id, name, avatar, status, current_task, current_task_summary, current_task_started FROM agents'
  ).all();
  res.json(agents);
});

// Get all agents
router.get('/', (_req: Request, res: Response) => {
  const agents = db.prepare('SELECT * FROM agents').all();
  // Add recent task count
  const enriched = agents.map((a: any) => {
    const taskCount = db.prepare(
      'SELECT COUNT(*) as count FROM workflows WHERE agent_id = ?'
    ).get(a.id) as any;
    const recentTasks = db.prepare(
      'SELECT id, task, status, started_at FROM workflows WHERE agent_id = ? ORDER BY started_at DESC LIMIT 5'
    ).all(a.id);
    return { ...a, taskCount: taskCount.count, recentTasks, capabilities: JSON.parse(a.capabilities || '[]') };
  });
  res.json(enriched);
});

// Get single agent
router.get('/:id', (req: Request, res: Response) => {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id) as any;
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  const integrations = db.prepare(`
    SELECT i.*, ai.enabled 
    FROM integrations i 
    JOIN agent_integrations ai ON i.id = ai.integration_id 
    WHERE ai.agent_id = ?
  `).all(req.params.id);
  agent.capabilities = JSON.parse(agent.capabilities || '[]');
  res.json({ ...agent, integrations });
});

// Toggle agent status
router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    res.status(400).json({ error: 'Status must be "active" or "inactive"' });
    return;
  }
  db.prepare('UPDATE agents SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(status, req.params.id);
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(req.params.id);
  res.json(agent);
});

export default router;
