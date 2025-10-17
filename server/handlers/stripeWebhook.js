const Stripe = require('stripe');
const { envConfig } = require('../config/env');

const stripeClient = envConfig.stripeSecretKey
  ? new Stripe(envConfig.stripeSecretKey, {
      apiVersion: '2023-10-16',
    })
  : null;

function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  const rawBody = req.body;

  if (envConfig.stripeWebhookSecret && stripeClient && signature) {
    try {
      stripeClient.webhooks.constructEvent(
        rawBody,
        signature,
        envConfig.stripeWebhookSecret
      );
    } catch (error) {
      console.error('Stripe webhook signature verification failed:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  res.status(200).json({ received: true });
}

module.exports = { handleStripeWebhook };
