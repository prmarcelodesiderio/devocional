const express = require('express');
const path = require('path');
const { envConfig, validateEnv } = require('./config/env');
const healthRouter = require('./routes/health');
const configRouter = require('./routes/config');
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

app.get('/client/pages/theology', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'pages', 'theology', 'index.html'));
});

app.use(express.static(path.resolve(__dirname, '..', 'client')));

app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'client', 'index.html'));
});

const port = envConfig.port;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
