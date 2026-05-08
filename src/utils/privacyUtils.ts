export const isSensitiveColumn = (column: string) => {
  const normalized = column.toUpperCase();
  return normalized.includes("DNI");
};

export const sanitizeName = (name: string) => name || "Sin identificar";

export const maskIdentifier = (value: string) => {
  if (!value) return "";
  const clean = value.trim();
  if (clean.length <= 4) return "****";
  return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
};
