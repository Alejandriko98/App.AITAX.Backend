import express from 'express';
import cookieParser from 'cookie-parser';
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-01';

const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_orders', 'read_customers'],
  hostName: (process.env.HOST || '').replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
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
    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: '/api/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
    res.redirect(authRoute);
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
    
    res.redirect(`/?shop=${callback.session.shop}&host=${req.query.host || ''}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Error completing OAuth');
  }
});

// Rutas
import('./routes/orders.js').then(module => app.use('/api', module.default)).catch(console.error);
import('./routes/analyze.js').then(module => app.use('/api/analyze', module.default)).catch(console.error);
import('./routes/billing.js').then(module => app.use('/api', module.default)).catch(console.error);
import('./routes/webhooks.js').then(module => app.use('/api', module.default)).catch(console.error);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AITAX Shopify backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// IMPORTANTE: antes de express.json(), captura el rawBody
app.use('/webhooks', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body;
  req.body = JSON.parse(req.body);
  next();
});

// Monta las rutas de webhooks
const webhookRoutes = require('./routes/webhooks');
app.use('/webhooks', webhookRoutes);
