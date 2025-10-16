const express = require('express');
const path = require('path');
const { envConfig, validateEnv } = require('./config/env');
const healthRouter = require('./routes/health');
const configRouter = require('./routes/config');
const generateRouter = require('./routes/generate');
const exportRouter = require('./routes/export');
const shareRouter = require('./routes/share');
const { handleStripeWebhook } = require('./handlers/stripeWebhook');

validateEnv();

const app = express();

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/config', configRouter);
app.use('/api/generate', generateRouter);
app.use('/api/export', exportRouter);
app.use('/api/share', shareRouter);

app.get('/client/pages/theology', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'pages', 'theology', 'index.html'));
});

app.get('/client/app/(wizard)/sermon', (_req, res) => {
  res.sendFile(
    path.resolve(__dirname, '..', 'client', 'app', '(wizard)', 'sermon', 'index.html')
  );
});

app.get('/client/app/result/:id', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'app', 'result', 'index.html'));
});

app.get('/share/:uuid', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'share', 'index.html'));
});

app.use(express.static(path.resolve(__dirname, '..', 'client')));

app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'index.html'));
});

const port = envConfig.port;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
