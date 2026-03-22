import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Get all execution logs
router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  const logs = db.prepare(`
    SELECT el.*, w.task as workflow_task, a.name as agent_name, a.avatar as agent_avatar
    FROM execution_logs el
    LEFT JOIN workflows w ON el.workflow_id = w.id
    LEFT JOIN agents a ON el.agent_id = a.id
    ORDER BY el.timestamp DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM execution_logs').get() as any;
  res.json({ logs, total: total.count });
});

// Get logs for a specific workflow
router.get('/workflow/:workflowId', (req: Request, res: Response) => {
  const logs = db.prepare(
    'SELECT * FROM execution_logs WHERE workflow_id = ? ORDER BY timestamp ASC'
  ).all(req.params.workflowId);
  res.json(logs);
});

export default router;
