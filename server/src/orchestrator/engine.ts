import { v4 as uuid } from 'uuid';
import db from '../db';
import { researchIntern } from './agents/research-intern';
import { secretaryIntern } from './agents/secretary-intern';

export interface TaskPayload {
  task: string;
  userId?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface RequiredField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
}

export interface AgentResult {
  success: boolean;
  output: any;
  toolCalls: { tool: string; input: any; output: any; timestamp: string }[];
  duration: number;
  /** If set, the task needs user approval instead of completing */
  needsApproval?: boolean;
  /** If set, the task needs user input with these fields */
  requiredFields?: RequiredField[];
}

export interface PlanStep {
  id: string;
  agent: string;
  agentAvatar: string;
  action: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting';
  tools: string[];
  output?: any;
  startedAt?: string;
  completedAt?: string;
}

function generateExecutionPlan(task: string, intent: string, agentId: string): PlanStep[] {
  const lower = task.toLowerCase();

  if (intent === 'research') {
    const subject = task.replace(/^(research|find|look up|investigate|analyze)\s*/i, '').trim();
    const steps: PlanStep[] = [
      {
        id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Analyze intent',
        description: `Parse task and determine research scope for "${subject}"`,
        status: 'completed', tools: ['intent_classifier'], completedAt: new Date().toISOString(),
      },
      {
        id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Route to Research Intern',
        description: `Delegate research task with context and priority`,
        status: 'completed', tools: ['agent_router'], completedAt: new Date().toISOString(),
      },
      {
        id: uuid(), agent: 'research-intern', agentAvatar: '🔍', action: 'Web search',
        description: `Search for "${subject}" across multiple sources`,
        status: 'pending', tools: ['web_search', 'google'],
      },
      {
        id: uuid(), agent: 'research-intern', agentAvatar: '🔍', action: 'Social analysis',
        description: `Analyze Twitter/X mentions, sentiment, and key discussions`,
        status: 'pending', tools: ['twitter_search', 'sentiment_analysis'],
      },
      {
        id: uuid(), agent: 'research-intern', agentAvatar: '🔍', action: 'Compile research brief',
        description: `Synthesize findings into structured brief`,
        status: 'pending', tools: ['data_synthesis'],
      },
      {
        id: uuid(), agent: 'research-intern', agentAvatar: '🔍', action: 'Save to Notion',
        description: `Store research brief in Notion → Research Briefs → ${subject}`,
        status: 'pending', tools: ['notion_write'],
      },
      {
        id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Review & request input',
        description: `Present findings and ask for next steps`,
        status: 'pending', tools: ['user_prompt'],
      },
    ];

    // Add competitor-specific steps
    if (lower.includes('competitor') || lower.includes('market') || lower.includes('comparison')) {
      steps.splice(4, 0, {
        id: uuid(), agent: 'research-intern', agentAvatar: '🔍', action: 'Competitive analysis',
        description: `Compare pricing, features, and positioning across competitors`,
        status: 'pending', tools: ['web_search', 'data_synthesis'],
      });
    }

    return steps;
  }

  if (intent === 'communication') {
    const isEmail = lower.includes('email') || lower.includes('send') || lower.includes('follow-up');
    const isSlack = lower.includes('slack');

    if (isEmail) {
      return [
        {
          id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Analyze intent',
          description: `Parse communication task and extract recipients, context`,
          status: 'completed', tools: ['intent_classifier'], completedAt: new Date().toISOString(),
        },
        {
          id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Route to Secretary Intern',
          description: `Delegate email task with context`,
          status: 'completed', tools: ['agent_router'], completedAt: new Date().toISOString(),
        },
        ...(lower.includes('meeting') || lower.includes('call') || lower.includes('gong') ? [{
          id: uuid(), agent: 'secretary-intern' as string, agentAvatar: '📧', action: 'Pull meeting context',
          description: `Check Gong for recent call transcripts and action items`,
          status: 'pending' as const, tools: ['gong_lookup'],
        }] : []),
        {
          id: uuid(), agent: 'secretary-intern', agentAvatar: '📧', action: 'Draft email',
          description: `Compose professional email based on context and task`,
          status: 'pending', tools: ['gmail_draft', 'text_generation'],
        },
        {
          id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Request approval',
          description: `Show draft to user for review before sending`,
          status: 'pending', tools: ['user_prompt'],
        },
        {
          id: uuid(), agent: 'secretary-intern', agentAvatar: '📧', action: 'Send email',
          description: `Send approved email via Gmail`,
          status: 'pending', tools: ['gmail_send'],
        },
      ];
    }

    if (isSlack) {
      return [
        {
          id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Analyze intent',
          description: `Parse message request and determine channel/recipients`,
          status: 'completed', tools: ['intent_classifier'], completedAt: new Date().toISOString(),
        },
        {
          id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Route to Secretary Intern',
          description: `Delegate Slack message task`,
          status: 'completed', tools: ['agent_router'], completedAt: new Date().toISOString(),
        },
        {
          id: uuid(), agent: 'secretary-intern', agentAvatar: '📧', action: 'Draft Slack message',
          description: `Compose message for the appropriate channel`,
          status: 'pending', tools: ['slack_compose', 'text_generation'],
        },
        {
          id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Request approval',
          description: `Show draft to user before posting`,
          status: 'pending', tools: ['user_prompt'],
        },
        {
          id: uuid(), agent: 'secretary-intern', agentAvatar: '📧', action: 'Post to Slack',
          description: `Send approved message to channel`,
          status: 'pending', tools: ['slack_send'],
        },
      ];
    }

    // Generic communication
    return [
      {
        id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Analyze intent',
        description: `Parse communication task`, status: 'completed', tools: ['intent_classifier'],
        completedAt: new Date().toISOString(),
      },
      {
        id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Route to Secretary Intern',
        description: `Delegate task`, status: 'completed', tools: ['agent_router'],
        completedAt: new Date().toISOString(),
      },
      {
        id: uuid(), agent: 'secretary-intern', agentAvatar: '📧', action: 'Process task',
        description: `Handle communication request`, status: 'pending', tools: ['text_generation'],
      },
      {
        id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Report results',
        description: `Present outcome to user`, status: 'pending', tools: ['user_prompt'],
      },
    ];
  }

  return [
    { id: uuid(), agent: 'kato', agentAvatar: '🧠', action: 'Analyze', description: 'Determine task type', status: 'pending', tools: ['intent_classifier'] },
  ];
}

function updatePlanStepStatuses(plan: PlanStep[], phase: 'running' | 'agent_done' | 'waiting_user'): PlanStep[] {
  const now = new Date().toISOString();
  return plan.map((step, i) => {
    if (step.status === 'completed') return step;
    if (phase === 'running' && step.status === 'pending') {
      // Mark agent execution steps as running/completed
      if (step.agent !== 'kato' || step.action.includes('Route')) {
        return { ...step, status: 'completed', completedAt: now };
      }
    }
    if (phase === 'agent_done') {
      // All agent steps done, last kato step is waiting
      if (step.agent !== 'kato') return { ...step, status: 'completed', completedAt: now };
      if (step.action.includes('Review') || step.action.includes('approval') || step.action.includes('Request')) {
        return { ...step, status: 'waiting' };
      }
    }
    if (phase === 'waiting_user') {
      if (step.agent !== 'kato') return { ...step, status: 'completed', completedAt: now };
      if (step.action.includes('Review') || step.action.includes('approval') || step.action.includes('Request') || step.action.includes('request')) {
        return { ...step, status: 'waiting' };
      }
    }
    return step;
  });
}

const RESEARCH_KEYWORDS = ['research', 'find', 'look up', 'investigate', 'analyze', 'search', 'gather', 'info about', 'what do we know', 'company profile'];
const SECRETARY_KEYWORDS = ['email', 'send', 'message', 'follow-up', 'follow up', 'schedule', 'remind', 'slack', 'draft', 'write to', 'notify', 'meeting notes', 'call summary'];

function classifyIntent(task: string): 'research' | 'communication' | 'unknown' {
  const lower = task.toLowerCase();
  const researchScore = RESEARCH_KEYWORDS.filter(k => lower.includes(k)).length;
  const secretaryScore = SECRETARY_KEYWORDS.filter(k => lower.includes(k)).length;

  if (researchScore > secretaryScore) return 'research';
  if (secretaryScore > researchScore) return 'communication';
  if (researchScore > 0) return 'research';
  return 'unknown';
}

function log(workflowId: string, agentId: string | null, eventType: string, message: string, data?: any) {
  db.prepare(
    'INSERT INTO execution_logs (id, workflow_id, agent_id, event_type, message, data) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uuid(), workflowId, agentId, eventType, message, data ? JSON.stringify(data) : null);
}

function setAgentWorking(agentId: string, workflowId: string, taskSummary: string) {
  db.prepare(
    'UPDATE agents SET current_task = ?, current_task_summary = ?, current_task_started = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?'
  ).run(workflowId, taskSummary, agentId);
}

function clearAgentWorking(agentId: string) {
  db.prepare(
    'UPDATE agents SET current_task = NULL, current_task_summary = NULL, current_task_started = NULL, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(agentId);
}

async function executeWithRetry(
  fn: (payload: TaskPayload) => Promise<AgentResult>,
  payload: TaskPayload,
  workflowId: string,
  agentId: string,
  maxRetries = 3
): Promise<AgentResult> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(workflowId, agentId, 'attempt', `Execution attempt ${attempt}/${maxRetries}`);
      const result = await fn(payload);
      if (result.success) return result;
      lastError = new Error('Agent returned failure');
    } catch (err: any) {
      lastError = err;
      log(workflowId, agentId, 'retry_error', `Attempt ${attempt} failed: ${err.message}`);
    }
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 500; // exponential backoff
      log(workflowId, agentId, 'backoff', `Waiting ${delay}ms before retry`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  log(workflowId, agentId, 'escalation', `All ${maxRetries} attempts failed. Escalating to human.`, { error: lastError?.message });
  throw lastError || new Error('Max retries exceeded');
}

export async function processTask(payload: TaskPayload): Promise<{
  workflowId: string;
  status: string;
  agent: string | null;
  result: any;
}> {
  const workflowId = uuid();

  // Create workflow record
  db.prepare(
    'INSERT INTO workflows (id, task, status, priority, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(workflowId, payload.task, 'processing', payload.priority || 'medium', payload.userId || 'admin');

  log(workflowId, null, 'task_received', `New task: "${payload.task}"`);

  // Classify intent
  const intent = classifyIntent(payload.task);
  log(workflowId, null, 'intent_classified', `Intent: ${intent}`, { intent });

  let agentId: string | null = null;
  let agentFn: ((p: TaskPayload) => Promise<AgentResult>) | null = null;

  if (intent === 'research') {
    agentId = 'research-intern';
    agentFn = researchIntern;
  } else if (intent === 'communication') {
    agentId = 'secretary-intern';
    agentFn = secretaryIntern;
  }

  if (!agentId || !agentFn) {
    log(workflowId, null, 'routing_failed', 'Could not determine appropriate agent');
    db.prepare('UPDATE workflows SET status = ?, error = ? WHERE id = ?')
      .run('failed', 'Unable to route task — intent unclear', workflowId);
    return { workflowId, status: 'failed', agent: null, result: { error: 'Could not determine which agent should handle this task. Try being more specific.' } };
  }

  // Check agent is active
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
  if (!agent || agent.status !== 'active') {
    log(workflowId, agentId, 'agent_inactive', `Agent ${agentId} is not active`);
    db.prepare('UPDATE workflows SET status = ?, agent_id = ?, error = ? WHERE id = ?')
      .run('failed', agentId, `Agent "${agent?.name || agentId}" is currently deactivated`, workflowId);
    return { workflowId, status: 'failed', agent: agentId, result: { error: `Agent "${agent?.name || agentId}" is currently deactivated. Enable it in the Admin Console.` } };
  }

  // Generate execution plan
  const plan = generateExecutionPlan(payload.task, intent, agentId);
  db.prepare('UPDATE workflows SET execution_plan = ? WHERE id = ?')
    .run(JSON.stringify(plan), workflowId);

  // Add initial Kato message
  db.prepare('INSERT INTO task_messages (id, workflow_id, role, message) VALUES (?, ?, ?, ?)')
    .run(uuid(), workflowId, 'kato', `Got it. I'll handle "${payload.task}". Routing to ${agent.name} now.`);

  // Route to agent
  log(workflowId, agentId, 'routing', `Routing to ${agent.name}`);
  db.prepare('UPDATE workflows SET agent_id = ?, status = ? WHERE id = ?')
    .run(agentId, 'running', workflowId);

  // Track agent working status
  const taskSummary = payload.task.length > 60 ? payload.task.slice(0, 57) + '...' : payload.task;
  setAgentWorking(agentId, workflowId, taskSummary);

  try {
    const result = await executeWithRetry(agentFn, payload, workflowId, agentId);

    // Log tool calls
    for (const tc of result.toolCalls) {
      log(workflowId, agentId, 'tool_call', `Tool: ${tc.tool}`, tc);
    }

    // Check if task needs approval or input
    if (result.needsApproval) {
      log(workflowId, agentId, 'needs_approval', `Task requires human approval`, { output: result.output });
      const updatedPlan = updatePlanStepStatuses(plan, 'waiting_user');
      db.prepare('UPDATE workflows SET status = ?, result = ?, execution_plan = ? WHERE id = ?')
        .run('needs_approval', JSON.stringify(result.output), JSON.stringify(updatedPlan), workflowId);
      db.prepare('INSERT INTO task_messages (id, workflow_id, role, message) VALUES (?, ?, ?, ?)')
        .run(uuid(), workflowId, 'kato', result.output?.summary || 'Task needs your approval before I can proceed.');
      clearAgentWorking(agentId);
      return { workflowId, status: 'needs_approval', agent: agentId, result: result.output };
    }

    if (result.requiredFields && result.requiredFields.length > 0) {
      log(workflowId, agentId, 'needs_input', `Task requires user input`, { output: result.output, requiredFields: result.requiredFields });
      const updatedPlan = updatePlanStepStatuses(plan, 'waiting_user');
      db.prepare('UPDATE workflows SET status = ?, result = ?, required_fields = ?, execution_plan = ? WHERE id = ?')
        .run('needs_input', JSON.stringify(result.output), JSON.stringify(result.requiredFields), JSON.stringify(updatedPlan), workflowId);
      db.prepare('INSERT INTO task_messages (id, workflow_id, role, message) VALUES (?, ?, ?, ?)')
        .run(uuid(), workflowId, 'kato', `Research complete. I have a few questions before wrapping up — check the plan details.`);
      clearAgentWorking(agentId);
      return { workflowId, status: 'needs_input', agent: agentId, result: result.output };
    }

    log(workflowId, agentId, 'completed', `Task completed in ${result.duration}ms`, { output: result.output });
    db.prepare('UPDATE workflows SET status = ?, result = ?, completed_at = datetime(\'now\') WHERE id = ?')
      .run('completed', JSON.stringify(result.output), workflowId);

    clearAgentWorking(agentId);
    return { workflowId, status: 'completed', agent: agentId, result: result.output };
  } catch (err: any) {
    clearAgentWorking(agentId);
    db.prepare('UPDATE workflows SET status = ?, error = ?, completed_at = datetime(\'now\') WHERE id = ?')
      .run('failed', err.message, workflowId);
    return { workflowId, status: 'failed', agent: agentId, result: { error: err.message } };
  }
}
