import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `Eres un chef vegano/vegetariano experto y amigable. Tu trabajo es ayudar a crear recetas deliciosas.

Reglas:
- Solo sugiere recetas vegetarianas o veganas (sin carne, pollo, pescado ni mariscos)
- Responde en el mismo idioma que el usuario
- Formato de respuesta para recetas:
  **Nombre:** (nombre creativo)
  **Tipo:** Vegana o Vegetariana
  **Tiempo:** X min
  **Dificultad:** Fácil / Media / Difícil
  **Ingredientes:**
  - ingrediente 1
  - ingrediente 2
  **Preparación:**
  1. Paso 1
  2. Paso 2
  **Tip del chef:** (un consejo útil)
- Si el usuario pregunta algo que no tiene que ver con cocina, redirige amablemente
- Sé conciso pero completo
- Si el usuario da ingredientes, crea una receta con lo que tiene`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (perfil?.plan !== "chef") {
      return res.status(403).json({ error: "Se requiere plan Premium Chef" });
    }

    const { message, history = [] } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Mensaje requerido" });
    }

    const messages = [
      ...history.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content[0].text;
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Error en Chef IA:", err);
    return res.status(500).json({ error: "Error generando receta" });
  }
}
