const LOCALE_MAP = {
  es: "es-PE",
  en: "en-US"
};

export function resolveLocale(lang) {
  return LOCALE_MAP[lang] || LOCALE_MAP.es;
}

export function formatDate(value, lang) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(resolveLocale(lang), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function formatMoney(value, lang) {
  const number = Number(value ?? 0);
  const formatted = new Intl.NumberFormat(resolveLocale(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
  return `S/ ${formatted}`;
}

export function formatNumber(value, lang, options) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat(resolveLocale(lang), options).format(number);
}
