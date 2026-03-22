import express from 'express';
import cors from 'cors';
import path from 'path';
import taskRoutes from './routes/tasks';
import agentRoutes from './routes/agents';
import integrationRoutes from './routes/integrations';
import logRoutes from './routes/logs';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/tasks', taskRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);

// Webhook endpoints for agents
app.post('/webhook/research-intern', async (req, res) => {
  const { processTask } = await import('./orchestrator/engine');
  try {
    const result = await processTask({ task: req.body.task || 'Research task via webhook', metadata: { source: 'webhook' } });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook/secretary-intern', async (req, res) => {
  const { processTask } = await import('./orchestrator/engine');
  try {
    const result = await processTask({ task: req.body.task || 'Communication task via webhook', metadata: { source: 'webhook' } });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
const clientBuild = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuild));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🤖 Kato server running on port ${PORT}`);
});
