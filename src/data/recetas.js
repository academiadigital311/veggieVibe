import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import recetasJson from "./recetas.json";

export const PREMIUM_IDS = new Set([
  11, 13, 15, 19, 20, 21, 23, 24, 25, 26, 27, 37, 38, 43, 44, 45, 46, 47, 48,
]);

export function useRecetas() {
  const { t } = useTranslation("recipes");

  return useMemo(
    () =>
      recetasJson.map((r) => ({
        ...r,
        nombre: t(`${r.id}.nombre`, r.nombre),
        ingredientes: t(`${r.id}.ingredientes`, { returnObjects: true, defaultValue: r.ingredientes }),
        pasos: t(`${r.id}.pasos`, { returnObjects: true, defaultValue: r.pasos }),
        tip: t(`${r.id}.tip`, r.tip),
        tags: t(`${r.id}.tags`, { returnObjects: true, defaultValue: r.tags }),
      })),
    [t],
  );
}
