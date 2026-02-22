import express from 'express';
import { shopify, loadSession } from '../server.js';

const router = express.Router();

router.get('/orders', async (req, res) => {
  const shop = req.query.shop;
  
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  const sessionId = shopify.session.getOfflineId(shop);
  const session = loadSession(sessionId) || loadSession(`${shop}_default`);
  
  if (!session) {
    return res.status(401).json({
      error: 'No autenticado',
      authUrl: `/api/auth?shop=${shop}`
    });
  }

  try {
    const client = new shopify.clients.Rest({ session });
    const limit = parseInt(req.query.limit) || 100;
    
    const response = await client.get({
      path: 'orders',
      query: {
        status: 'any',
        limit,
        fields: 'id,created_at,billing_address,tax_lines,subtotal_price,note_attributes,customer'
      },
    });

    const orders = response.body.orders || [];
    
    const rows = orders.map((order, i) => {
      const vatLine = order.tax_lines?.[0];
      const vatPercent = vatLine ? parseFloat(vatLine.rate) * 100 : 0;
      const vatNumber = order.note_attributes?.find(a => a.name === 'vat_number')?.value || '';
      
      return {
        row_number: i + 1,
        shopify_order_id: order.id,
        seller_country: process.env.SELLER_COUNTRY || 'ES',
        customer_country: order.billing_address?.country_code || '',
        customer_vat_number: vatNumber,
        invoice_date: order.created_at?.split('T')[0] || '',
        net_amount: parseFloat(order.subtotal_price) || 0,
        vat_applied_percent: vatPercent,
      };
    });

    res.json({
      rows,
      total: rows.length,
      shop
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders from Shopify' });
  }
});

export default router;
