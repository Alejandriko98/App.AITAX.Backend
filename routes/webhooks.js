import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Middleware para verificar HMAC de Shopify
function verifyShopifyWebhook(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  
  if (!hmac) {
    console.log('Missing HMAC header');
    return res.status(401).send('Unauthorized');
  }

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(JSON.stringify(req.body), 'utf8')
    .digest('base64');

  if (hash !== hmac) {
    console.log('Invalid HMAC');
    return res.status(401).send('Unauthorized');
  }

  next();
}

// Apply middleware to all webhook routes
router.use('/webhooks/*', verifyShopifyWebhook);

// GDPR Webhook: Customer data request
router.post('/webhooks/customers/data_request', (req, res) => {
  const { shop_domain, customer, orders_requested } = req.body;
  
  console.log('=== CUSTOMER DATA REQUEST ===');
  console.log(`Shop: ${shop_domain}`);
  console.log(`Customer: ${customer.email}`);
  console.log(`Orders: ${orders_requested}`);
  
  // TODO: When you have a database, query and return customer data
  // For now, just logging (compliant with Shopify requirements)
  
  res.status(200).send('OK');
});

// GDPR Webhook: Customer redact (delete data)
router.post('/webhooks/customers/redact', (req, res) => {
  const { shop_domain, customer, orders_to_redact } = req.body;
  
  console.log('=== CUSTOMER REDACT ===');
  console.log(`Shop: ${shop_domain}`);
  console.log(`Customer: ${customer.email}`);
  console.log(`Orders to redact: ${orders_to_redact}`);
  
  // TODO: When you have a database, delete customer data
  // For now, just logging (compliant with Shopify requirements)
  
  res.status(200).send('OK');
});

// GDPR Webhook: Shop redact (store uninstalled)
router.post('/webhooks/shop/redact', (req, res) => {
  const { shop_domain, shop_id } = req.body;
  
  console.log('=== SHOP REDACT ===');
  console.log(`Shop: ${shop_domain} (ID: ${shop_id})`);
  
  // TODO: When you have a database, delete ALL data for this shop
  // For now, just logging (compliant with Shopify requirements)
  
  res.status(200).send('OK');
});

export default router;
