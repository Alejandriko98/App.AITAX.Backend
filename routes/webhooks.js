// routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Verificar HMAC de Shopify
function verifyShopifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_API_SECRET;
  const body = req.rawBody; // necesitas rawBody (ver nota abajo)

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
  const { shop_id, shop_domain, customer, orders_requested } = req.body;
  console.log(`Data request for customer ${customer?.email} in shop ${shop_domain}`);
  // Tu app no almacena datos personales → simplemente confirmas recepción
  res.status(200).json({ message: 'Received' });
});

// customers/redact
router.post('/customers/redact', shopifyWebhookAuth, (req, res) => {
  const { shop_id, shop_domain, customer, orders_to_redact } = req.body;
  console.log(`Redact request for customer ${customer?.email} in shop ${shop_domain}`);
  // Si no guardas datos de clientes, solo confirmas recepción
  res.status(200).json({ message: 'Received' });
});

// shop/redact
router.post('/shop/redact', shopifyWebhookAuth, (req, res) => {
  const { shop_id, shop_domain } = req.body;
  console.log(`Shop redact request for ${shop_domain}`);
  // Elimina cualquier dato del shop si lo tienes almacenado
  res.status(200).json({ message: 'Received' });
});

module.exports = router;
