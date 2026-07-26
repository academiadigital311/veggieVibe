// Vista previa de recetas para redes sociales (WhatsApp, Facebook, X...).
//
// Los robots que generan la tarjeta de vista previa leen el HTML tal cual llega,
// sin ejecutar JavaScript, así que la app de React no alcanza a poner sus datos.
// Esta función entrega HTML con las etiquetas Open Graph ya rellenas para cada
// receta, y manda a las personas reales a la app.

import { createRequire } from "node:module";
import { PREMIUM_ID_LIST } from "../src/data/premiumIds.js";

// createRequire lee el JSON sin depender de los "import attributes", que
// cambiaron de sintaxis entre versiones de Node y rompen según dónde se ejecute.
const require = createRequire(import.meta.url);
const recetas = require("../src/data/recetas.json");

const PREMIUM_IDS = new Set(PREMIUM_ID_LIST);

const SITE_NAME = "Viridia";
const FALLBACK_IMAGE = "/icon-512.png";

const DIETA = { vegetariana: "Vegetariana", vegana: "Vegana" };
const COMIDA = { desayuno: "Desayuno", almuerzo: "Almuerzo", cena: "Cena", snack: "Snack" };
const DIFICULTAD = { 1: "Fácil", 2: "Dificultad media", 3: "Difícil" };

// Escapa el texto antes de meterlo en atributos HTML.
function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// WhatsApp y Facebook muestran la imagen en 1.91:1; las fotos vienen de Unsplash
// recortadas a 600x400, así que pedimos una versión con las medidas correctas.
function ogImage(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.searchParams.set("w", "1200");
    u.searchParams.set("h", "630");
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return url;
  }
}

export default function handler(req, res) {
  const origin = `https://${req.headers.host}`;
  const id = String(req.query.id || "").trim();
  const receta = recetas.find((r) => String(r.id) === id);

  if (!receta) {
    res.setHeader("Location", `${origin}/`);
    return res.status(302).end();
  }

  const esPremium = PREMIUM_IDS.has(receta.id);
  const appUrl = `${origin}/?receta=${receta.id}&utm_source=share&utm_medium=social`;
  const canonical = `${origin}/r/${receta.id}`;
  const imagen = ogImage(receta.imagen) || `${origin}${FALLBACK_IMAGE}`;

  const titulo = `${receta.emoji || "🌿"} ${receta.nombre}`;
  const detalles = [
    DIETA[receta.tipo],
    COMIDA[receta.comida],
    receta.tiempo,
    DIFICULTAD[receta.dificultad],
  ]
    .filter(Boolean)
    .join(" · ");

  const descripcion = esPremium
    ? `${detalles}. Receta Premium de Viridia — desbloquéala y cocina rico todos los días, sin quedarte sin ideas.`
    : `${detalles}. Receta gratis en Viridia: planifica tu semana y arma tu lista de compras en segundos.`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(titulo)} — ${SITE_NAME}</title>
<meta name="description" content="${esc(descripcion)}" />
<link rel="canonical" href="${esc(canonical)}" />

<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(titulo)}" />
<meta property="og:description" content="${esc(descripcion)}" />
<meta property="og:image" content="${esc(imagen)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(receta.nombre)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:locale" content="es_ES" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(titulo)}" />
<meta name="twitter:description" content="${esc(descripcion)}" />
<meta name="twitter:image" content="${esc(imagen)}" />

<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
<meta name="theme-color" content="#2D5A27" />
<meta http-equiv="refresh" content="0; url=${esc(appUrl)}" />
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background:#F3FAF1; color:#1E2E24; }
  .box { text-align:center; padding:32px; }
  .box img { width:64px; height:64px; border-radius:16px; }
  .box p { color:#5E7468; font-size:14px; margin:16px 0 0; }
  .box a { color:#0E6B4E; font-size:14px; }
</style>
</head>
<body>
  <div class="box">
    <img src="/icon-192.png" alt="${SITE_NAME}" />
    <p>Abriendo <strong>${esc(receta.nombre)}</strong> en ${SITE_NAME}…</p>
    <p><a href="${esc(appUrl)}">Continuar</a></p>
  </div>
  <script>window.location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Las recetas cambian poco: dejamos que la CDN cachee la vista previa.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
  return res.status(200).send(html);
}
