const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.ENV_PATH || path.resolve(process.cwd(), '.env');
dotenv.config({ path: envFile });

const REQUIRED_ENV_VARS = ['STRIPE_SECRET_KEY', 'DATABASE_URL', 'OPENAI_API_KEY'];

const toBool = (value) => String(value).toLowerCase() === 'true';

const envConfig = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  databaseUrl: process.env.DATABASE_URL || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  port: Number(process.env.PORT || 3000),
  featureFlags: {
    study: toBool(process.env.FF_STUDY || 'false'),
    rag: toBool(process.env.FF_RAG || 'false'),
    export: toBool(process.env.FF_EXPORT || 'false'),
  },
};

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'The application may not function correctly until they are provided.'
    );
  }
}

module.exports = {
  envConfig,
  validateEnv,
};
