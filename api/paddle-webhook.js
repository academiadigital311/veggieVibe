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

// --- Allowlist de IPs de Paddle (se consulta dinámicamente, con caché de 1 hora) ---
let ipCache = { cidrs: null, fetchedAt: 0 };
const IP_CACHE_TTL_MS = 60 * 60 * 1000;

async function getPaddleIpCidrs() {
  const now = Date.now();
  if (ipCache.cidrs && now - ipCache.fetchedAt < IP_CACHE_TTL_MS) {
    return ipCache.cidrs;
  }
  try {
    const res = await fetch("https://api.paddle.com/ips");
    const json = await res.json();
    const cidrs = json?.data?.ipv4_cidrs || [];
    ipCache = { cidrs, fetchedAt: now };
    return cidrs;
  } catch (err) {
    console.error("No se pudo obtener la lista de IPs de Paddle:", err.message);
    return ipCache.cidrs; // usa la caché vieja si existe, o null
  }
}

function ipToLong(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpInCidr(ip, cidr) {
  const [range, bitsStr] = cidr.split("/");
  const bits = bitsStr === undefined ? 32 : parseInt(bitsStr, 10);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (!forwarded) return null;
  return forwarded.split(",")[0].trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const cidrs = await getPaddleIpCidrs();
  if (cidrs) {
    const clientIp = getClientIp(req);
    const allowed = clientIp && cidrs.some((cidr) => isIpInCidr(clientIp, cidr));
    if (!allowed) {
      console.error("Webhook rechazado: IP no autorizada:", clientIp);
      return res.status(403).send("Forbidden");
    }
  }

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
