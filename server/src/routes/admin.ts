import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Get all roles
router.get('/roles', (_req: Request, res: Response) => {
  const roles = db.prepare('SELECT * FROM roles').all();
  res.json(roles.map((r: any) => ({ ...r, permissions: JSON.parse(r.permissions) })));
});

// Get all users
router.get('/users', (_req: Request, res: Response) => {
  const users = db.prepare(
    'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id'
  ).all();
  res.json(users);
});

// Switch user role
router.patch('/users/:id/role', (req: Request, res: Response) => {
  const { roleId } = req.body;
  db.prepare('UPDATE users SET role_id = ? WHERE id = ?').run(roleId, req.params.id);
  const user = db.prepare(
    'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?'
  ).get(req.params.id);
  res.json(user);
});

// Get dashboard stats
router.get('/stats', (_req: Request, res: Response) => {
  const totalWorkflows = (db.prepare('SELECT COUNT(*) as c FROM workflows').get() as any).c;
  const completedWorkflows = (db.prepare('SELECT COUNT(*) as c FROM workflows WHERE status = ?').get('completed') as any).c;
  const failedWorkflows = (db.prepare('SELECT COUNT(*) as c FROM workflows WHERE status = ?').get('failed') as any).c;
  const activeAgents = (db.prepare('SELECT COUNT(*) as c FROM agents WHERE status = ?').get('active') as any).c;
  const totalAgents = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as any).c;
  const connectedIntegrations = (db.prepare('SELECT COUNT(*) as c FROM integrations WHERE status = ?').get('connected') as any).c;
  const totalIntegrations = (db.prepare('SELECT COUNT(*) as c FROM integrations').get() as any).c;
  const recentWorkflows = db.prepare(
    'SELECT w.*, a.name as agent_name, a.avatar as agent_avatar FROM workflows w LEFT JOIN agents a ON w.agent_id = a.id ORDER BY w.started_at DESC LIMIT 10'
  ).all();

  res.json({
    totalWorkflows,
    completedWorkflows,
    failedWorkflows,
    activeAgents,
    totalAgents,
    connectedIntegrations,
    totalIntegrations,
    successRate: totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 100) : 0,
    recentWorkflows,
  });
});

export default router;
