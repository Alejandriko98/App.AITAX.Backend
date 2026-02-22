# AITAX Shopify Backend

Backend Node.js/Express para la app AITAX de Shopify.

## 🚀 Despliegue en Render (PASO A PASO)

### 1. Sube este código a GitHub

**Opción A: Web Interface (MÁS FÁCIL)**

1. Ve a https://github.com/new
2. Repository name: `shopify-aitax-backend`
3. Private
4. NO marques "Initialize with README"
5. Click "Create repository"
6. En la página que aparece, click "uploading an existing file"
7. Arrastra TODA esta carpeta (todos los archivos)
8. Click "Commit changes"

**Opción B: GitHub Desktop**

1. Abre GitHub Desktop
2. File → Add Local Repository
3. Selecciona esta carpeta
4. Publish repository

### 2. Conecta con Render

1. Ve a https://dashboard.render.com
2. Sign up / Login (usa tu cuenta GitHub)
3. Click "New +" → "Web Service"
4. Click "Connect GitHub"
5. Autoriza Render
6. Busca y selecciona: `shopify-aitax-backend`
7. Render detectará automáticamente `render.yaml`
8. Click "Create Web Service"

### 3. Espera el deploy (5-10 minutos)

Render automáticamente:
- Instala dependencias (`npm install`)
- Inicia el servidor (`npm start`)
- Te da una URL pública

### 4. Copia tu URL

Una vez deployado, verás algo como:
```
https://shopify-aitax-backend-abc123.onrender.com
```

**COPIA ESTA URL** (la necesitarás para Shopify)

### 5. Actualiza Shopify Partners

1. Ve a https://partners.shopify.com
2. Apps → AITAX → App setup
3. URLs:
   - **App URL:** `https://TU-URL.onrender.com`
   - **Allowed redirection URL(s):**
     ```
     https://TU-URL.onrender.com/api/auth/callback
     ```
4. Save

### 6. Actualiza la variable HOST en Render

1. En Render dashboard → tu servicio
2. Environment → Edit
3. Cambia `HOST` de:
   ```
   https://shopify-aitax-backend.onrender.com
   ```
   A tu URL real:
   ```
   https://shopify-aitax-backend-abc123.onrender.com
   ```
4. Save Changes (Render redeploya automáticamente)

### 7. Prueba la instalación

1. En Shopify Partners → Stores → Add store → Development store
2. Nombre: `aitax-test`
3. Create

4. Abre en navegador:
   ```
   https://TU-URL.onrender.com/api/auth?shop=aitax-test.myshopify.com
   ```

5. Acepta los permisos

6. **¡Funciona!** ✅

---

## 📡 Endpoints disponibles

- `GET /health` - Health check
- `GET /api/auth?shop=TIENDA.myshopify.com` - Inicia OAuth
- `GET /api/auth/callback` - Callback OAuth de Shopify
- `GET /api/orders?shop=TIENDA` - Obtiene pedidos de Shopify
- `POST /api/analyze` - Analiza transacciones y detecta errores VAT
- `POST /api/billing/create?shop=TIENDA` - Crea suscripción mensual
- `GET /api/billing/callback` - Callback después de aprobar billing

---

## 🔧 Variables de entorno

Todas configuradas automáticamente en `render.yaml`:

- `SHOPIFY_API_KEY` - Tu API key de Shopify Partners
- `SHOPIFY_API_SECRET` - Tu API secret de Shopify Partners  
- `HOST` - URL pública de este backend (actualízala después del primer deploy)
- `SELLER_COUNTRY` - País del vendedor (default: ES)
- `NODE_ENV` - production
- `PORT` - Puerto (Render lo asigna automáticamente)

---

## 🐛 Troubleshooting

**Error: "Missing shop parameter"**
→ Asegúrate de incluir `?shop=TIENDA.myshopify.com` en la URL

**Error: "No autenticado"**
→ Necesitas completar el OAuth primero: `/api/auth?shop=TIENDA`

**OAuth no funciona**
→ Verifica que las URLs en Shopify Partners coinciden EXACTAMENTE con tu URL de Render

**Render no deploya**
→ Revisa los logs en Render dashboard → Logs tab

---

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs en Render (tab "Logs")
2. Verifica que las URLs en Shopify Partners sean correctas
3. Asegúrate que las API keys de Shopify sean las correctas

---

## 🎯 Próximos pasos

Una vez funcionando:
1. Crea tu tienda de prueba en Shopify
2. Instala la app
3. Agrega algunos pedidos de prueba
4. Llama a `/api/orders` para verlos
5. Llama a `/api/analyze` para detectar errores
6. Prueba el billing con `/api/billing/create`

¡Todo listo para empezar! 🚀
