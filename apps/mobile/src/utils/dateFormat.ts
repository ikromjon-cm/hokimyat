export function formatDate(date: string | Date, locale: "uz" | "ru" | "en" = "uz"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric", month: "long", day: "numeric",
  };
  return d.toLocaleDateString(locale === "uz" ? "uz-Cyrl-UZ" : locale === "ru" ? "ru-RU" : "en-US", options);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("uz-Cyrl-UZ", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(date: string | Date, locale: "uz" | "ru" | "en" = "uz"): string {
  return `${formatDate(date, locale)} ${formatTime(date)}`;
}

export function isToday(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export function timeAgo(date: string | Date, locale: "uz" | "ru" | "en" = "uz"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals: Array<[number, string, string, string]> = [
    [31536000, "yil", "год", "year"],
    [2592000, "oy", "мес", "month"],
    [604800, "hafta", "нед", "week"],
    [86400, "kun", "дн", "day"],
    [3600, "soat", "час", "hour"],
    [60, "daq", "мин", "min"],
  ];

  for (const [interval, uz, ru, en] of intervals) {
    const count = Math.floor(seconds / interval);
    if (count >= 1) {
      const labels = { uz, ru, en } as const;
      return `${count} ${labels[locale]} oldin`;
    }
  }

  return "hozir";
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}
