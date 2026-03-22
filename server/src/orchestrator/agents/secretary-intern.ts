import { TaskPayload, AgentResult } from '../engine';

function extractEmailDetails(task: string) {
  const recipientMatch = task.match(/(?:to|for)\s+(\w+)/i);
  const aboutMatch = task.match(/(?:about|regarding|re:?)\s+(.+?)(?:\s+to\s+|\s*$)/i);
  return {
    recipient: recipientMatch ? recipientMatch[1] : 'Unknown',
    subject: aboutMatch ? aboutMatch[1].trim() : 'Follow-up',
  };
}

export async function secretaryIntern(payload: TaskPayload): Promise<AgentResult> {
  const start = Date.now();
  const toolCalls: AgentResult['toolCalls'] = [];
  const task = payload.task.toLowerCase();

  const isEmail = task.includes('email') || task.includes('send') || task.includes('follow-up') || task.includes('follow up');
  const isSlack = task.includes('slack') || task.includes('message');
  const isMeeting = task.includes('meeting') || task.includes('call') || task.includes('gong');

  if (isMeeting) {
    // Simulate Gong lookup
    await new Promise(r => setTimeout(r, 600));
    toolCalls.push({
      tool: 'gong_lookup',
      input: { query: payload.task },
      output: { callsFound: 2, latestCall: 'Team sync - yesterday' },
      timestamp: new Date().toISOString(),
    });
  }

  const details = extractEmailDetails(payload.task);

  if (isEmail || (!isSlack && !isMeeting)) {
    // Simulate email draft
    await new Promise(r => setTimeout(r, 700));
    const emailDraft = {
      to: `${details.recipient.toLowerCase()}@company.com`,
      subject: `Re: ${details.subject}`,
      body: `Hi ${details.recipient},\n\nHope you're doing well! I wanted to follow up on ${details.subject.toLowerCase()}.\n\nA few key points from our discussion:\n• We aligned on the main deliverables and timeline\n• Next steps include finalizing the proposal by end of week\n• I'll share the updated deck with your team by Thursday\n\nLet me know if you'd like to schedule a quick sync to go over anything.\n\nBest,\nKato (on behalf of Raj)`,
      status: 'draft',
    };

    toolCalls.push({
      tool: 'gmail_draft',
      input: { to: emailDraft.to, subject: emailDraft.subject },
      output: { draftId: 'draft-' + Date.now(), status: 'created' },
      timestamp: new Date().toISOString(),
    });

    const output = {
      type: 'email',
      action: 'Draft created — awaiting your approval',
      draft: emailDraft,
      summary: `Email draft to ${details.recipient} about "${details.subject}" is ready for review.`,
      storedIn: 'Gmail → Drafts',
    };

    // Email tasks need approval
    return { success: true, output, toolCalls, duration: Date.now() - start, needsApproval: true };
  }

  if (isSlack) {
    await new Promise(r => setTimeout(r, 500));
    const slackMessage = {
      channel: '#general',
      message: `Hey team — quick update on ${details.subject}. ${details.recipient} and I synced earlier. Will share notes shortly.`,
    };

    toolCalls.push({
      tool: 'slack_send',
      input: slackMessage,
      output: { messageId: 'slack-msg-' + Date.now(), status: 'drafted' },
      timestamp: new Date().toISOString(),
    });

    // Slack tasks also need approval
    return {
      success: true,
      output: {
        type: 'slack',
        action: 'Message drafted — awaiting your approval',
        message: slackMessage,
        summary: `Slack message to ${slackMessage.channel} ready for review`,
      },
      toolCalls,
      duration: Date.now() - start,
      needsApproval: true,
    };
  }

  // Generic communication task
  await new Promise(r => setTimeout(r, 600));
  return {
    success: true,
    output: {
      type: 'communication',
      action: 'Task processed',
      summary: `Communication task handled: "${payload.task}"`,
      details: { recipient: details.recipient, subject: details.subject },
    },
    toolCalls,
    duration: Date.now() - start,
  };
}
