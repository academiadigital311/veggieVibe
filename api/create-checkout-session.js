import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IDs de precio que creas en tu Dashboard de Stripe (Products → Prices).
// Reemplázalos por los tuyos reales una vez los crees (ver README).
const PRICE_IDS = {
  mensual: process.env.STRIPE_PRICE_MENSUAL,
  anual: process.env.STRIPE_PRICE_ANUAL,
  chef_mensual: process.env.STRIPE_PRICE_CHEF_MENSUAL,
  chef_anual: process.env.STRIPE_PRICE_CHEF_ANUAL,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { planId, userId, email } = req.body;
    const priceId = PRICE_IDS[planId];
    if (!priceId) {
      return res.status(400).json({ error: "Plan inválido" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId, // para identificar al usuario en el webhook
      success_url: `${req.headers.origin}/?pago=exito`,
      cancel_url: `${req.headers.origin}/?pago=cancelado`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creando sesión de Stripe:", err);
    return res.status(500).json({ error: err.message });
  }
}
