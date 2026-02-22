import express from 'express';
const router = express.Router();

// GDPR Webhook: Customer data request
router.post('/webhooks/customers/data_request', (req, res) => {
  const { shop_domain, customer } = req.body;
  
  console.log(`Customer data request from ${shop_domain} for customer ${customer.email}`);
  
  // TODO: When you have a database, query and return customer data
  // For now, just logging
  
  res.status(200).send('OK');
});

// GDPR Webhook: Customer redact (delete data)
router.post('/webhooks/customers/redact', (req, res) => {
  const { shop_domain, customer } = req.body;
  
  console.log(`Customer redact request from ${shop_domain} for customer ${customer.email}`);
  
  // TODO: When you have a database, delete customer data
  // For now, just logging
  
  res.status(200).send('OK');
});

// GDPR Webhook: Shop redact (store uninstalled)
router.post('/webhooks/shop/redact', (req, res) => {
  const { shop_domain } = req.body;
  
  console.log(`Shop redact request from ${shop_domain}`);
  
  // TODO: When you have a database, delete ALL data for this shop
  // For now, just logging
  
  res.status(200).send('OK');
});

export default router;
