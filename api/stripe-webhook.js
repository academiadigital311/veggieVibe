import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const CHEF_PRICE_IDS = new Set(
  [process.env.STRIPE_PRICE_CHEF_MENSUAL, process.env.STRIPE_PRICE_CHEF_ANUAL].filter(Boolean)
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Firma de webhook inválida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (userId) {
          let plan = "premium";
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          if (priceId && CHEF_PRICE_IDS.has(priceId)) {
            plan = "chef";
          }
          await supabaseAdmin
            .from("profiles")
            .upsert({ id: userId, is_premium: true, plan, stripe_customer_id: session.customer });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabaseAdmin
          .from("profiles")
          .update({ is_premium: false, plan: "free" })
          .eq("stripe_customer_id", sub.customer);
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error procesando webhook:", err);
    return res.status(500).json({ error: err.message });
  }
}
