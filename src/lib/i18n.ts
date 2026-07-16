/**
 * TravelWell.World — lightweight i18n for the core-flow screens (1c).
 *
 * No framework: a typed message dictionary + a `useT()` hook that reads the
 * live locale from the store, so switching language re-renders localized copy
 * in place (Arabic then renders as real RTL text — numbers and punctuation
 * correct, unlike dir=rtl over English). Scope is deliberately the demo-critical
 * surface a cold visitor sees first — the header nav + the home hero — not the
 * whole app (the full string extraction is the larger i18n retrofit).
 *
 * Keys fall back to English when a locale is missing (the staged languages
 * de/pt/ja/ko show English until translated). Brand + product names —
 * "TravelWell", "Atlas" — are never translated.
 *
 * These launch-language strings are demo-ready; a native-speaker polish pass is
 * worth doing before scale (especially the Arabic).
 */
import { useStore } from "@/store/useStore";

type Dict = { en: string; es?: string; ar?: string; zh?: string; fr?: string };

export const MESSAGES: Record<string, Dict> = {
  // ── Header nav ──────────────────────────────────────────────────────────
  "nav.worlds":  { en: "Worlds of Adventure", es: "Mundos de Aventura", ar: "عوالم المغامرة", zh: "冒险世界", fr: "Mondes d'Aventure" },
  "nav.plan":    { en: "Plan", es: "Planificar", ar: "خطّط", zh: "规划", fr: "Planifier" },
  "nav.guides":  { en: "Guides", es: "Guías", ar: "أدلّة", zh: "指南", fr: "Guides" },
  "nav.about":   { en: "About", es: "Acerca de", ar: "من نحن", zh: "关于", fr: "À propos" },
  "nav.signin":  { en: "Sign in", es: "Iniciar sesión", ar: "تسجيل الدخول", zh: "登录", fr: "Se connecter" },
  "nav.atlas":   { en: "Speak with Atlas", es: "Habla con Atlas", ar: "تحدّث مع أطلس", zh: "与 Atlas 对话", fr: "Parler avec Atlas" },

  // ── Home hero (first screen a cold visitor sees) ────────────────────────
  "hero.eyebrow": { en: "A Travel Operating System", es: "Un Sistema Operativo de Viajes", ar: "نظام تشغيل للسفر", zh: "旅行操作系统", fr: "Un Système d'Exploitation du Voyage" },
  "hero.title1":  { en: "Your next journey, ", es: "Tu próximo viaje, ", ar: "رحلتك القادمة، ", zh: "你的下一段旅程，", fr: "Votre prochain voyage, " },
  "hero.title2":  { en: "designed around you.", es: "diseñado en torno a ti.", ar: "مصمَّمة حولك.", zh: "为你而设计。", fr: "conçu autour de vous." },
  "hero.lead":    {
    en: "Tell us what moves you. We route you from a single spark — an interest, a place, a feeling — all the way to a booked, beautifully organized trip. One clear step at a time.",
    es: "Cuéntanos qué te mueve. Te llevamos desde una sola chispa —un interés, un lugar, una emoción— hasta un viaje reservado y bellamente organizado. Un paso claro a la vez.",
    ar: "أخبِرنا بما يحرّكك. نأخذك من شرارة واحدة — اهتمام، أو مكان، أو شعور — إلى رحلة محجوزة ومنظَّمة بعناية. خطوة واضحة في كل مرة.",
    zh: "告诉我们什么打动你。我们从一个火花——一种兴趣、一个地方、一种感觉——一路带你抵达一趟已预订、精心安排的旅程。每次一个清晰的步骤。",
    fr: "Dites-nous ce qui vous inspire. Nous vous menons d'une simple étincelle — un intérêt, un lieu, une émotion — jusqu'à un voyage réservé et magnifiquement organisé. Une étape claire à la fois.",
  },
  "hero.cta1": { en: "Design Your Dream Journey", es: "Diseña el viaje de tus sueños", ar: "صمِّم رحلة أحلامك", zh: "设计你的梦想旅程", fr: "Concevez le voyage de vos rêves" },
  "hero.cta2": { en: "Not sure? Speak with Atlas", es: "¿No estás seguro? Habla con Atlas", ar: "لست متأكّدًا؟ تحدّث مع أطلس", zh: "还不确定？与 Atlas 对话", fr: "Pas sûr ? Parlez avec Atlas" },
  "hero.taps1": { en: "4–5 taps from here to a booked trip", es: "De aquí a un viaje reservado en 4–5 toques", ar: "من هنا إلى رحلة محجوزة في 4–5 نقرات", zh: "从这里到预订成行，只需 4–5 步", fr: "4–5 étapes d'ici à un voyage réservé" },
  "hero.taps2": { en: "No account needed to start", es: "No necesitas cuenta para empezar", ar: "لا حاجة إلى حساب للبدء", zh: "无需账户即可开始", fr: "Aucun compte requis pour commencer" },
};

export function translate(key: string, locale: string): string {
  const entry = MESSAGES[key];
  if (!entry) return key;
  return (entry as Record<string, string | undefined>)[locale] ?? entry.en ?? key;
}

/** Hook: returns `t(key)` bound to the live locale; re-renders on switch. */
export function useT() {
  const locale = useStore((s) => s.locale);
  return (key: string) => translate(key, locale);
}
