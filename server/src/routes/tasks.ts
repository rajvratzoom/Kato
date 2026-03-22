import { Router, Request, Response } from 'express';
import { processTask } from '../orchestrator/engine';
import db from '../db';

const router = Router();

// Submit a new task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { task, userId, priority } = req.body;
    if (!task) {
      res.status(400).json({ error: 'Task text is required' });
      return;
    }
    const result = await processTask({ task, userId, priority });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get tasks grouped by kanban columns
router.get('/kanban', (_req: Request, res: Response) => {
  const queue = db.prepare(
    `SELECT w.*, a.name as agent_name, a.avatar as agent_avatar 
     FROM workflows w LEFT JOIN agents a ON w.agent_id = a.id 
     WHERE w.status = 'pending' AND w.archived_at IS NULL
     ORDER BY w.started_at DESC`
  ).all();

  const inProgress = db.prepare(
    `SELECT w.*, a.name as agent_name, a.avatar as agent_avatar 
     FROM workflows w LEFT JOIN agents a ON w.agent_id = a.id 
     WHERE w.status IN ('running', 'processing') AND w.archived_at IS NULL
     ORDER BY w.started_at DESC`
  ).all();

  const needsYou = db.prepare(
    `SELECT w.*, a.name as agent_name, a.avatar as agent_avatar 
     FROM workflows w LEFT JOIN agents a ON w.agent_id = a.id 
     WHERE w.status IN ('needs_input', 'needs_approval') AND w.archived_at IS NULL
     ORDER BY w.started_at DESC`
  ).all();

  // Done: only last 3 days, not archived
  const done = db.prepare(
    `SELECT w.*, a.name as agent_name, a.avatar as agent_avatar 
     FROM workflows w LEFT JOIN agents a ON w.agent_id = a.id 
     WHERE w.status IN ('completed', 'failed') AND w.archived_at IS NULL
     AND w.completed_at >= datetime('now', '-3 days')
     ORDER BY w.completed_at DESC`
  ).all();

  // Parse required_fields JSON for needs_you items
  const parseFields = (items: any[]) => items.map((item: any) => ({
    ...item,
    required_fields: item.required_fields ? JSON.parse(item.required_fields) : null,
    result: item.result ? JSON.parse(item.result) : null,
  }));

  res.json({
    queue,
    inProgress,
    needsYou: parseFields(needsYou),
    done: done.map((d: any) => ({ ...d, result: d.result ? JSON.parse(d.result) : null })),
  });
});

// Get all workflows
router.get('/', (_req: Request, res: Response) => {
  const workflows = db.prepare(
    'SELECT w.*, a.name as agent_name, a.avatar as agent_avatar FROM workflows w LEFT JOIN agents a ON w.agent_id = a.id ORDER BY w.started_at DESC LIMIT 50'
  ).all();
  res.json(workflows);
});

// Get single workflow with plan, logs, and messages
router.get('/:id', (req: Request, res: Response) => {
  const workflow = db.prepare(
    'SELECT w.*, a.name as agent_name, a.avatar as agent_avatar FROM workflows w LEFT JOIN agents a ON w.agent_id = a.id WHERE w.id = ?'
  ).get(req.params.id) as any;
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  const logs = db.prepare(
    'SELECT * FROM execution_logs WHERE workflow_id = ? ORDER BY timestamp ASC'
  ).all(req.params.id);
  const messages = db.prepare(
    'SELECT * FROM task_messages WHERE workflow_id = ? ORDER BY timestamp ASC'
  ).all(req.params.id);
  res.json({
    ...workflow,
    result: workflow.result ? JSON.parse(workflow.result) : null,
    execution_plan: workflow.execution_plan ? JSON.parse(workflow.execution_plan) : null,
    required_fields: workflow.required_fields ? JSON.parse(workflow.required_fields) : null,
    user_input: workflow.user_input ? JSON.parse(workflow.user_input) : null,
    logs,
    messages,
  });
});

// Send a message to Kato about a task
router.post('/:id/message', (req: Request, res: Response) => {
  const { v4: muuid } = require('uuid');
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // Save user message
  db.prepare('INSERT INTO task_messages (id, workflow_id, role, message) VALUES (?, ?, ?, ?)')
    .run(muuid(), req.params.id, 'user', message);

  // Generate Kato response (mock for POC)
  const lower = message.toLowerCase();
  let katoResponse = '';

  if (lower.includes('change') || lower.includes('modify') || lower.includes('update')) {
    katoResponse = `Got it. I'll adjust the plan based on your feedback. What specifically would you like me to change?`;
  } else if (lower.includes('skip') || lower.includes('remove')) {
    katoResponse = `Understood. I'll remove that step from the plan and proceed with the rest.`;
  } else if (lower.includes('add') || lower.includes('also') || lower.includes('include')) {
    katoResponse = `Good call. I'll add that to the plan. The intern will handle it in the next pass.`;
  } else if (lower.includes('priority') || lower.includes('urgent') || lower.includes('rush')) {
    katoResponse = `Bumping this to high priority. I'll push the interns to complete this faster.`;
    db.prepare('UPDATE workflows SET priority = ? WHERE id = ?').run('high', req.params.id);
  } else if (lower.includes('cancel') || lower.includes('stop') || lower.includes('abort')) {
    katoResponse = `Cancelling this task. It'll be moved to Done as cancelled.`;
    db.prepare('UPDATE workflows SET status = ?, error = ?, completed_at = datetime(\'now\') WHERE id = ?')
      .run('failed', 'Cancelled by user', req.params.id);
  } else if (lower.includes('approve') || lower.includes('send it') || lower.includes('looks good') || lower.includes('lgtm')) {
    if (workflow.status === 'needs_approval') {
      katoResponse = `Approved! Sending it out now.`;
      db.prepare('UPDATE workflows SET status = ?, completed_at = datetime(\'now\') WHERE id = ?')
        .run('completed', req.params.id);
    } else {
      katoResponse = `Noted. Let me know if there's anything else you need on this task.`;
    }
  } else {
    katoResponse = `Noted. I'll factor that into how the interns handle this. Anything else you'd like to adjust?`;
  }

  db.prepare('INSERT INTO task_messages (id, workflow_id, role, message) VALUES (?, ?, ?, ?)')
    .run(muuid(), req.params.id, 'kato', katoResponse);

  // Return updated messages
  const messages = db.prepare(
    'SELECT * FROM task_messages WHERE workflow_id = ? ORDER BY timestamp ASC'
  ).all(req.params.id);
  res.json({ messages });
});

// Approve a task
router.patch('/:id/approve', (req: Request, res: Response) => {
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  if (workflow.status !== 'needs_approval') {
    res.status(400).json({ error: 'Task is not awaiting approval' });
    return;
  }
  db.prepare(
    'UPDATE workflows SET status = ?, completed_at = datetime(\'now\') WHERE id = ?'
  ).run('completed', req.params.id);
  res.json({ success: true, status: 'completed' });
});

// Reject a task
router.patch('/:id/reject', (req: Request, res: Response) => {
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  if (workflow.status !== 'needs_approval') {
    res.status(400).json({ error: 'Task is not awaiting approval' });
    return;
  }
  db.prepare(
    'UPDATE workflows SET status = ?, error = ?, completed_at = datetime(\'now\') WHERE id = ?'
  ).run('failed', 'Rejected by user', req.params.id);
  res.json({ success: true, status: 'failed' });
});

// Submit user input for a needs_input task
router.patch('/:id/input', (req: Request, res: Response) => {
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  if (workflow.status !== 'needs_input') {
    res.status(400).json({ error: 'Task is not awaiting input' });
    return;
  }
  const { input } = req.body;
  db.prepare(
    'UPDATE workflows SET status = ?, user_input = ?, completed_at = datetime(\'now\') WHERE id = ?'
  ).run('completed', JSON.stringify(input), req.params.id);
  res.json({ success: true, status: 'completed' });
});

export default router;
