import { Paddle, EventName, Environment } from "@paddle/paddle-node-sdk";
import { createClient } from "@supabase/supabase-js";
import { buffer } from "micro";

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment: process.env.PADDLE_API_KEY?.includes("_sdbx") ? Environment.sandbox : Environment.production,
});
const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

const CHEF_PRICE_IDS = new Set(
  [process.env.PADDLE_PRICE_CHEF_MENSUAL, process.env.PADDLE_PRICE_CHEF_ANUAL].filter(Boolean)
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers["paddle-signature"];

  let event;
  try {
    event = await paddle.webhooks.unmarshal(buf.toString(), webhookSecret, sig);
  } catch (err) {
    console.error("Firma de webhook inválida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.eventType) {
      case EventName.TransactionCompleted: {
        const tx = event.data;
        const userId = tx.customData?.user_id;
        if (userId) {
          const priceId = tx.items?.[0]?.price?.id;
          const plan = priceId && CHEF_PRICE_IDS.has(priceId) ? "chef" : "premium";
          await supabaseAdmin
            .from("profiles")
            .upsert({ id: userId, is_premium: true, plan, paddle_customer_id: tx.customerId, paddle_subscription_id: tx.subscriptionId });
        }
        break;
      }
      case EventName.SubscriptionCanceled: {
        const sub = event.data;
        await supabaseAdmin
          .from("profiles")
          .update({ is_premium: false, plan: "free" })
          .eq("paddle_subscription_id", sub.id);
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error procesando webhook de Paddle:", err);
    return res.status(500).json({ error: err.message });
  }
}
