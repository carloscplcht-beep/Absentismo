export const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits }).format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value: number, digits = 1) =>
  `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value * 100 : 0)}%`;

export const formatCurrency = (value: number, compact = false) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: compact ? 1 : 2,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? "compact" : "standard",
    compactDisplay: "short"
  }).format(Number.isFinite(value) ? value : 0);

export const formatDate = (value: Date | null | undefined) => {
  if (!value || Number.isNaN(value.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES").format(value);
};

export const dateInputValue = (value: Date | null | undefined) => {
  if (!value || Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
};

export const coverageStatus = (value: number) => {
  if (value >= 0.8) return "good";
  if (value >= 0.5) return "warn";
  return "bad";
};

export const downloadCsv = (fileName: string, rows: Array<Record<string, unknown>>) => {
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  const escape = (value: unknown) => {
    const text = value instanceof Date ? formatDate(value) : String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [headers.join(";"), ...rows.map((row) => headers.map((header) => escape(row[header])).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};
