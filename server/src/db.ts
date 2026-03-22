import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'kato.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'active',
    capabilities TEXT,
    current_task TEXT,
    current_task_summary TEXT,
    current_task_started TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    status TEXT DEFAULT 'disconnected',
    config TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_integrations (
    agent_id TEXT NOT NULL,
    integration_id TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    PRIMARY KEY (agent_id, integration_id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (integration_id) REFERENCES integrations(id)
  );

  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    task TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    agent_id TEXT,
    result TEXT,
    error TEXT,
    priority TEXT DEFAULT 'medium',
    required_fields TEXT,
    user_input TEXT,
    archived_at TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    created_by TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS execution_logs (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    agent_id TEXT,
    event_type TEXT NOT NULL,
    message TEXT,
    data TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
  );

  CREATE TABLE IF NOT EXISTS task_messages (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
  );

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    permissions TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );
`);

// Migration: add new columns if they don't exist
function addColumnIfMissing(table: string, column: string, type: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  if (!cols.find((c: any) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

// Workflow columns
addColumnIfMissing('workflows', 'priority', 'TEXT DEFAULT \'medium\'');
addColumnIfMissing('workflows', 'required_fields', 'TEXT');
addColumnIfMissing('workflows', 'user_input', 'TEXT');
addColumnIfMissing('workflows', 'archived_at', 'TEXT');
addColumnIfMissing('workflows', 'execution_plan', 'TEXT');

// Agent columns
addColumnIfMissing('agents', 'current_task', 'TEXT');
addColumnIfMissing('agents', 'current_task_summary', 'TEXT');
addColumnIfMissing('agents', 'current_task_started', 'TEXT');

// Seed data
const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as any;
if (agentCount.count === 0) {
  const insertAgent = db.prepare(
    'INSERT INTO agents (id, name, type, description, avatar, status, capabilities) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insertAgent.run(
    'research-intern',
    'Research Intern',
    'research',
    'Gathers information, synthesizes data, and writes research briefs. Reads/writes to Notion, searches Twitter/X.',
    '🔍',
    'active',
    JSON.stringify(['web_research', 'data_synthesis', 'notion_write', 'twitter_search'])
  );
  insertAgent.run(
    'secretary-intern',
    'Secretary Intern',
    'communication',
    'Handles communication tasks — emails, Slack messages, meeting follow-ups, and Gong summaries.',
    '📧',
    'active',
    JSON.stringify(['email_send', 'slack_message', 'meeting_followup', 'gong_summary'])
  );
}

const integrationCount = db.prepare('SELECT COUNT(*) as count FROM integrations').get() as any;
if (integrationCount.count === 0) {
  const insertIntegration = db.prepare(
    'INSERT INTO integrations (id, name, icon, description, status) VALUES (?, ?, ?, ?, ?)'
  );
  const integrations = [
    ['jira', 'Jira', '📋', 'Project management & issue tracking', 'connected'],
    ['notion', 'Notion', '📝', 'Shared knowledge base & context layer', 'connected'],
    ['slack', 'Slack', '💬', 'Team messaging & notifications', 'connected'],
    ['gmail', 'Gmail', '✉️', 'Email send, read, and parse', 'connected'],
    ['gong', 'Gong', '🎙️', 'Call transcripts & action items', 'disconnected'],
    ['twitter', 'Twitter/X', '🐦', 'Social search, profiles, activity', 'disconnected'],
  ];
  for (const i of integrations) {
    insertIntegration.run(...i);
  }

  // Agent-integration mappings
  const insertAI = db.prepare(
    'INSERT INTO agent_integrations (agent_id, integration_id, enabled) VALUES (?, ?, ?)'
  );
  // Research Intern
  insertAI.run('research-intern', 'notion', 1);
  insertAI.run('research-intern', 'twitter', 1);
  insertAI.run('research-intern', 'jira', 1);
  // Secretary Intern
  insertAI.run('secretary-intern', 'gmail', 1);
  insertAI.run('secretary-intern', 'slack', 1);
  insertAI.run('secretary-intern', 'gong', 1);
  insertAI.run('secretary-intern', 'jira', 1);
}

const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as any;
if (roleCount.count === 0) {
  const insertRole = db.prepare('INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)');
  insertRole.run('admin', 'Admin', JSON.stringify(['*']));
  insertRole.run('manager', 'Manager', JSON.stringify(['workflows:create', 'workflows:read', 'logs:read', 'agents:read']));
  insertRole.run('viewer', 'Viewer', JSON.stringify(['logs:read', 'workflows:read']));

  // Default admin user
  const insertUser = db.prepare('INSERT INTO users (id, name, email, role_id) VALUES (?, ?, ?, ?)');
  insertUser.run('user-admin', 'Raj', 'raj@kato.ai', 'admin');
  insertUser.run('user-manager', 'Manager', 'manager@kato.ai', 'manager');
  insertUser.run('user-viewer', 'Viewer', 'viewer@kato.ai', 'viewer');
}

export default db;
