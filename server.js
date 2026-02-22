import express from 'express';
import cookieParser from 'cookie-parser';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { nodeAdapter } from '@shopify/shopify-api/adapters/node';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-01';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(cookieParser());

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_orders', 'read_customers'],
  hostName: (process.env.HOST || '').replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  adapter: nodeAdapter,
  restResources,
});

// Session store en memoria (MVP)
const sessions = new Map();
export const storeSession = s => sessions.set(s.id, s);
export const loadSession = id => sessions.get(id) || null;

// OAuth
app.get('/api/auth', async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop parameter');
  
  try {
    const url = await shopify.auth.begin({
      shop,
      callbackPath: '/api/auth/callback',
      isOnline: true,
      rawRequest: req,
      rawResponse: res,
    });
    res.redirect(url);
  } catch (error) {
    console.error('OAuth begin error:', error);
    res.status(500).send('Error starting OAuth');
  }
});

app.get('/api/auth/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });
    
    storeSession(callback.session);
    
    res.redirect(`/?shop=${callback.session.shop}&host=${req.query.host}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Error completing OAuth');
  }
});

// Rutas
import('./routes/orders.js').then(module => app.use('/api', module.default));
import('./routes/analyze.js').then(module => app.use('/api', module.default));
import('./routes/billing.js').then(module => app.use('/api', module.default));

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AITAX Shopify backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
