import { TaskPayload, AgentResult } from '../engine';

function extractSubject(task: string): string {
  const patterns = [
    /research\s+(?:on\s+)?(.+?)(?:\s+and|\s+for|\s*$)/i,
    /find\s+(?:info|information)\s+(?:on|about)\s+(.+?)(?:\s+and|\s*$)/i,
    /look\s+up\s+(.+?)(?:\s+and|\s*$)/i,
    /investigate\s+(.+?)(?:\s+and|\s*$)/i,
    /analyze\s+(.+?)(?:\s+and|\s*$)/i,
  ];
  for (const p of patterns) {
    const m = task.match(p);
    if (m) return m[1].trim();
  }
  return task.replace(/^(research|find|look up|investigate|analyze)\s*/i, '').trim();
}

/**
 * Generates context-aware follow-up fields based on the task.
 * The intern "thinks" about what info would be useful next.
 */
function generateContextualFields(task: string, subject: string): AgentResult['requiredFields'] {
  const lower = task.toLowerCase();

  // Company/competitor research
  if (lower.includes('competitor') || lower.includes('competition') || lower.includes('market')) {
    return [
      { id: 'focus_area', label: 'Which aspect matters most?', type: 'select', options: ['Pricing', 'Features', 'Market share', 'Growth trajectory', 'All of the above'] },
      { id: 'action', label: 'What should I do with this?', type: 'select', options: ['Create a comparison deck', 'Add to CRM notes', 'Share with team on Slack', 'Just save it'] },
    ];
  }

  // Person/people research
  if (lower.includes('who') || lower.includes('person') || lower.includes('contact') || lower.includes('linkedin') || lower.includes('founder') || lower.includes('ceo')) {
    return [
      { id: 'relationship', label: 'How do you know them?', type: 'select', options: ['Met at event', 'LinkedIn connection', 'Referred by someone', 'Cold outreach target', 'Other'] },
      { id: 'notes', label: 'Anything to remember about them?', type: 'text', placeholder: 'e.g., interested in AI, based in SF, runs a fund' },
      { id: 'next_step', label: 'Next step?', type: 'select', options: ['Draft intro email', 'Schedule coffee chat', 'Add to CRM', 'No action needed'] },
    ];
  }

  // Financial/earnings research
  if (lower.includes('earning') || lower.includes('revenue') || lower.includes('stock') || lower.includes('financ') || lower.includes('valuation')) {
    return [
      { id: 'track', label: 'Want me to track this?', type: 'select', options: ['Yes, alert me on changes', 'No, one-time lookup'] },
      { id: 'share', label: 'Share findings?', type: 'select', options: ['Post to Slack', 'Email summary', 'Save to Notion only'] },
    ];
  }

  // Product/tool research
  if (lower.includes('tool') || lower.includes('product') || lower.includes('software') || lower.includes('saas') || lower.includes('platform')) {
    return [
      { id: 'use_case', label: 'What would you use it for?', type: 'text', placeholder: 'e.g., team collaboration, sales pipeline' },
      { id: 'action', label: 'Next step?', type: 'select', options: ['Compare with alternatives', 'Book a demo', 'Share with team', 'Just save the research'] },
    ];
  }

  // Generic company research (default)
  return [
    { id: 'action', label: 'What should I do next?', type: 'select', options: ['Dig deeper', 'Draft outreach email', 'Schedule follow-up', 'Save and move on'] },
  ];
}

export async function researchIntern(payload: TaskPayload): Promise<AgentResult> {
  const start = Date.now();
  const subject = extractSubject(payload.task);
  const toolCalls: AgentResult['toolCalls'] = [];

  // Simulate web search
  await new Promise(r => setTimeout(r, 800));
  toolCalls.push({
    tool: 'web_search',
    input: { query: subject },
    output: { results: 12, topResult: `${subject} - Company Overview` },
    timestamp: new Date().toISOString(),
  });

  // Simulate Twitter search
  await new Promise(r => setTimeout(r, 500));
  toolCalls.push({
    tool: 'twitter_search',
    input: { query: subject },
    output: { tweets: 8, sentiment: 'positive' },
    timestamp: new Date().toISOString(),
  });

  // Simulate Notion write
  await new Promise(r => setTimeout(r, 400));
  const researchOutput = {
    subject,
    summary: `Research on "${subject}" complete — ${Math.floor(Math.random() * 10) + 8} sources analyzed.`,
    keyFindings: [
      `${subject} is an established player in their market segment`,
      `Recent funding round suggests strong growth trajectory`,
      `Key competitors include 3-4 major players in the space`,
      `Social media sentiment is largely positive (72% favorable)`,
      `Leadership team has strong backgrounds in enterprise tech`,
    ],
    metrics: {
      sourcesAnalyzed: 15,
      dataPointsCollected: 47,
      confidenceScore: 0.85,
    },
    recommendation: `Schedule a deeper dive into ${subject}'s competitive positioning. Consider reaching out to mutual connections for warm intro.`,
    storedIn: 'Notion → Research Briefs → ' + subject,
  };

  toolCalls.push({
    tool: 'notion_write',
    input: { page: `Research Briefs/${subject}`, content: researchOutput },
    output: { pageId: 'notion-page-' + Date.now(), status: 'created' },
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    output: researchOutput,
    toolCalls,
    duration: Date.now() - start,
    requiredFields: generateContextualFields(payload.task, subject),
  };
}
