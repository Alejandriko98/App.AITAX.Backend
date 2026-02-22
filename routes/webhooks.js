// routes/webhooks.js
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Verificar HMAC de Shopify
function verifyShopifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_API_SECRET;
  const body = req.rawBody;

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmac;
}

// Middleware para verificar y responder 401 si falla
function shopifyWebhookAuth(req, res, next) {
  if (!verifyShopifyWebhook(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// customers/data_request
router.post('/customers/data_request', shopifyWebhookAuth, (req, res) => {
  const { shop_domain, customer } = req.body;
  console.log(`Data request for customer ${customer?.email} in shop ${shop_domain}`);
  res.status(200).json({ message: 'Received' });
});

// customers/redact
router.post('/customers/redact', shopifyWebhookAuth, (req, res) => {
  const { shop_domain, customer } = req.body;
  console.log(`Redact request for customer ${customer?.email} in shop ${shop_domain}`);
  res.status(200).json({ message: 'Received' });
});

// shop/redact
router.post('/shop/redact', shopifyWebhookAuth, (req, res) => {
  const { shop_domain } = req.body;
  console.log(`Shop redact request for ${shop_domain}`);
  res.status(200).json({ message: 'Received' });
});

export default router;
