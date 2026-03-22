# KATO - Product Requirements Document

## Executive Summary
AI-powered multi-agent orchestration platform. Automates complex business workflows by decomposing user intent into tasks, delegating to specialized sub-agents, coordinating execution across third-party tools.

## Problem
Knowledge workers waste hours on manual coordination across fragmented tools. Existing automation (Zapier/Make) is rigid. AI assistants inform but don't execute. No unified layer for orchestrating AI agents across systems.

## Architecture
- **Kato (Orchestrator):** Central brain — interprets intent, routes tasks. Bidirectional Jira sync. Does NOT execute tools directly.
- **Research Intern:** Info gathering/synthesis. Reads/writes Notion. Searches Twitter/X. Webhook-triggered.
- **Secretary Intern:** Communication/coordination. Email, Slack, Gong integration. Webhook-triggered.
- **Intern Context Layer (Notion):** Shared memory/knowledge base. Persistent state between executions.

## Execution Model
- Directed acyclic graph (DAG) — tasks move forward only
- Flexible entry points — any node can start a workflow
- Sub-agents are stateless at runtime — pull context from Notion
- Structured handoff payloads (task type, context, priority, metadata)
- Async execution with completion events

## Integrations (MVP)
- Jira (bidirectional)
- Notion (context layer)
- Slack (messages, DMs, channel history)
- Gmail/SMTP (send, read, parse)
- Gong (call transcripts, action items)
- Twitter/X (search, profiles, activity)
- Webhooks (inbound on all sub-agents)

## MVP Features (P0)
1. Orchestrator engine (intent → routing)
2. Jira bidirectional sync
3. Research Intern agent
4. Secretary Intern agent
5. Webhook listeners
6. Notion context layer
7. Directed graph execution

## P1 Features
- Flexible entry points
- Execution audit log
- Human-in-the-loop approval gates

## Non-Functional
- 99.5% uptime SLA
- <30s agent handoff round-trips
- Encrypted credential storage
- Full observability/logging
- 50+ concurrent agent runs
- Extensible agent architecture

## Roadmap
- **Phase 1 (Month 1-2):** Orchestrator core, Jira sync, webhooks, Research Intern, Notion layer
- **Phase 2 (Month 3-4):** Secretary Intern (Email/Slack/Gong), flexible entry points, audit log
- **Phase 3 (Month 5-6):** Human-in-the-loop, visual graph, error recovery
- **Phase 4 (Month 7+):** Custom agent SDK, more integrations, multi-tenant, analytics

## Decisions (Resolved)
1. **Agent communication:** All through Kato. No direct agent-to-agent handoffs. Kato is the single routing layer.
2. **Notion access:** TBD (defaulting to read/write for both agents for now)
3. **External triggers:** TBD (Kato-first for POC, direct webhook bypass deferred)
4. **Failure handling:** Retry 3x with exponential backoff → escalate to human on final failure → log everything
5. **Human-in-the-loop:** Configurable subset (POC: optional approval gate on irreversible actions)
6. **UI:** Simple UI for business users. Agents = interns metaphor. Functional for POC, not pixel-perfect.
7. **Async SLA:** Best-effort for POC, formalize later

## Admin Console & RBAC
- **Agent activation:** Toggle agents on/off from admin dashboard
- **MCP/Integration activation:** Enable/disable integrations (Jira, Slack, Gmail, Gong, Twitter, Notion) per agent or globally
- **Roles:** Admin (full control, activate/deactivate agents & integrations), Manager (trigger workflows, view logs), Viewer (read-only execution logs)
- **Inspiration:** Workato RBAC model — connection manager + agent permissions unified
- **POC scope:** Functional admin panel, role selection, agent/MCP toggle UI

## Technical Decisions
- **Stack:** Node.js / TypeScript
- **Deployment:** Self-hosted (POC)
- **Target audience:** Business users (enterprise), not developers
- **Goal:** POC to demo to Raj's boss

## Target Metrics
- 60%+ task automation rate
- >5 hours saved per user/week (first 60 days)
- >95% agent execution success without human intervention
- 10+ tool integrations at launch
- <10 min to configure a new workflow
