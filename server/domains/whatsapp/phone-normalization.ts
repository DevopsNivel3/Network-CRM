export const normalizePhone = (input: string) => {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) {
    if (digits.length === 12) {
      return `${digits.slice(0, 4)}9${digits.slice(4)}`;
    }
    return digits;
  }
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
};

export const normalizePhoneFromJid = (jid: string) =>
  normalizePhone(jid?.split("@")[0] || "");

export const normalizeFromJid = normalizePhoneFromJid;

export const getPhoneVariants = (input: string) => {
  const normalized = normalizePhone(input);
  if (!normalized) return [];
  const variants = new Set([normalized]);
  if (normalized.startsWith("55")) {
    const prefix = normalized.slice(0, 4);
    const subscriber = normalized.slice(4);
    if (subscriber.length === 9 && subscriber.startsWith("9")) {
      variants.add(`${prefix}${subscriber.slice(1)}`);
    } else if (subscriber.length === 8) {
      variants.add(`${prefix}9${subscriber}`);
    }
  }
  return [...variants];
};
