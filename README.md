# Recetas Verdes 🌿

App de recetas vegetarianas y veganas con favoritas, cuenta de usuario y suscripción Premium (Stripe).

## Qué incluye
- 49 recetas (30 gratis + 19 Premium)
- Buscador por nombre, ingrediente o tag
- Favoritas guardadas por usuario (Supabase Auth + base de datos)
- Suscripción Premium mensual/anual vía Stripe Checkout
- El estado Premium se verifica en el servidor (webhook de Stripe), no en el navegador — nadie puede desbloquearlo editando el código del cliente

## Paso a paso para publicarla

### 1. Sube este código a GitHub
1. Entra a github.com, crea una cuenta si no tienes.
2. Clic en "New repository" → nómbralo `recetas-verdes` → Create repository.
3. En la página del repo vacío, usa el botón "uploading an existing file" y arrastra **todos los archivos y carpetas de este proyecto** (excepto la carpeta `node_modules`, que no existe todavía).
4. Confirma el commit.

### 2. Crea tu proyecto en Supabase (base de datos + usuarios)
1. Entra a supabase.com → crea cuenta gratis → "New Project".
2. Ponle un nombre y una contraseña de base de datos (guárdala, no la necesitarás seguido).
3. Cuando el proyecto esté listo, ve a **SQL Editor** → "New query" → pega todo el contenido de `supabase/schema.sql` de este proyecto → Run. Esto crea las tablas `profiles`, `favoritas` y `meal_plans` con seguridad automática.
4. Ve a **Project Settings → API** y copia:
   - `Project URL` → lo usarás como `VITE_SUPABASE_URL` y `SUPABASE_URL`
   - `anon public key` → lo usarás como `VITE_SUPABASE_ANON_KEY`
   - `service_role key` (dale clic a "Reveal") → lo usarás como `SUPABASE_SERVICE_ROLE_KEY`. **Esta clave es secreta, nunca la pongas en el frontend.**
5. Ve a **Authentication → Providers** y confirma que "Email" esté activado (lo está por defecto).

### 3. Crea tus productos en Stripe
1. Entra a stripe.com → crea cuenta gratis (puedes probar todo en modo test primero).
2. Ve a **Product catalog → Add product**. Crea dos:
   - "Recetas Verdes Mensual" — precio recurrente $3.99/mes
   - "Recetas Verdes Anual" — precio recurrente $24.99/año
3. En cada producto, copia el **Price ID** (empieza con `price_...`).
4. Ve a **Developers → API keys** y copia la **Secret key** (`sk_test_...` en modo prueba).

### 4. Importa el proyecto en Vercel
1. Entra a vercel.com → inicia sesión con tu cuenta de GitHub.
2. "Add New... → Project" → elige el repositorio `recetas-verdes`.
3. Antes de darle "Deploy", abre la sección **Environment Variables** y agrega todas estas (los valores salen de los pasos 2 y 3):

   | Nombre | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | tu Project URL de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | tu anon public key |
   | `SUPABASE_URL` | mismo Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | tu service_role key |
   | `STRIPE_SECRET_KEY` | tu Secret key de Stripe |
   | `STRIPE_PRICE_MENSUAL` | el Price ID del plan mensual |
   | `STRIPE_PRICE_ANUAL` | el Price ID del plan anual |
   | `STRIPE_WEBHOOK_SECRET` | lo obtienes en el paso 5, puedes dejarlo vacío por ahora y editarlo después |

4. Dale "Deploy". En un par de minutos tendrás una URL pública tipo `recetas-verdes.vercel.app`.

### 5. Conecta el webhook de Stripe (para que el pago marque Premium de verdad)
1. En Stripe, ve a **Developers → Webhooks → Add endpoint**.
2. URL del endpoint: `https://TU-DOMINIO.vercel.app/api/stripe-webhook`
3. Elige el evento `checkout.session.completed` (y opcionalmente `customer.subscription.deleted`).
4. Copia el **Signing secret** (`whsec_...`) que te muestra Stripe.
5. Vuelve a Vercel → tu proyecto → **Settings → Environment Variables** → edita `STRIPE_WEBHOOK_SECRET` con ese valor → guarda → ve a **Deployments** y vuelve a desplegar ("Redeploy") para que tome el cambio.

### 6. Prueba todo antes de activarlo en real
1. En tu app publicada, crea una cuenta de prueba.
2. Haz clic en "Hazte Premium" y usa una tarjeta de prueba de Stripe: `4242 4242 4242 4242`, cualquier fecha futura, cualquier CVC.
3. Confirma que después del pago, tu cuenta puede ver las recetas Premium.
4. Cuando todo funcione, activa el modo real en Stripe (verificación de negocio) y reemplaza las claves de test por las claves live en Vercel.

### 7. (Opcional) Dominio propio
En Vercel → tu proyecto → **Settings → Domains**, agrega tu dominio comprado (ej. recetasverdes.app) y sigue las instrucciones de DNS que te muestra.

## Desarrollo local
```bash
npm install
cp .env.example .env   # completa los valores
npm run dev
```

## Completado
- ✅ Fotos reales de Unsplash en las 49 recetas (`src/data/recetas.json`)
- ✅ Traducción a inglés (ES/EN) con `react-i18next` — detección automática de idioma + toggle manual
- ✅ Plan semanal (7 días × 4 comidas) con selector de recetas, guardado en Supabase (`meal_plans`)
- ✅ Lista de compras auto-generada a partir del plan semanal, con checkboxes en localStorage
