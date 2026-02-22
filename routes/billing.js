import express from 'express';
import { shopify, loadSession } from '../server.js';

const router = express.Router();

router.post('/billing/create', async (req, res) => {
  const shop = req.query.shop || req.body.shop;
  
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  const sessionId = shopify.session.getOfflineId(shop);
  const session = loadSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const client = new shopify.clients.Graphql({ session });
    const isTest = process.env.NODE_ENV !== 'production';
    
    const mutation = `
      mutation {
        appSubscriptionCreate(
          name: "AITAX Pro",
          returnUrl: "${process.env.HOST}/api/billing/callback?shop=${shop}",
          test: ${isTest},
          lineItems: [{
            plan: {
              appRecurringPricingDetails: {
                price: { amount: 29.00, currencyCode: EUR },
                interval: EVERY_30_DAYS
              }
            }
          }]
        ) {
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({ data: mutation });
    const { confirmationUrl, userErrors } = response.body.data.appSubscriptionCreate;
    
    if (userErrors && userErrors.length > 0) {
      return res.status(400).json({ 
        error: userErrors[0].message,
        field: userErrors[0].field 
      });
    }

    res.json({ confirmationUrl });
  } catch (error) {
    console.error('Billing creation error:', error);
    res.status(500).json({ error: 'Error creating subscription' });
  }
});

router.get('/billing/callback', (req, res) => {
  const { shop, host } = req.query;
  
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  res.redirect(`/?shop=${shop}&host=${host}&billing=activated`);
});

export default router;
