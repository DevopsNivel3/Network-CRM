import type { LocalizeIaLead, LocalizeIaListEntry } from "./localizeia.types";

export const normalizePhone = (rawPhone?: string | null) => {
  if (!rawPhone || rawPhone === "-") return "-";

  const onlyDigits = rawPhone.replace(/\D/g, "");
  if (onlyDigits.length === 11) {
    return onlyDigits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (onlyDigits.length === 10) {
    return onlyDigits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return rawPhone;
};

export const buildWhatsAppUrl = (rawPhone?: string | null) => {
  if (!rawPhone || rawPhone === "-") return "-";

  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "-";
  if (!digits.startsWith("55")) digits = `55${digits}`;

  return `https://wa.me/${digits}`;
};

export const normalizeCnpj = (rawCnpj?: string | null) => {
  if (!rawCnpj || rawCnpj === "-") return "-";

  const digits = rawCnpj.replace(/\D/g, "");
  if (digits.length !== 14) return rawCnpj.trim() || "-";

  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5",
  );
};

export const normalizeComparableText = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();

export const getComparableTokens = (value?: string | null) =>
  normalizeComparableText(value)
    .split(" ")
    .filter((token) => token.length >= 3)
    .filter(
      (token) =>
        ![
          "ltda",
          "me",
          "eireli",
          "empresa",
          "comercio",
          "servicos",
          "servico",
          "brasil",
        ].includes(token),
    );

export const getCompanySearchTerms = (companyName: string) => {
  const terms = [
    companyName,
    companyName.replace(/\([^)]*\)/g, " "),
    companyName.split(",")[0],
    companyName.replace(/\b(antiga|antigo)\b.*$/i, " "),
  ]
    .map((term) => term.replace(/\s+/g, " ").trim())
    .filter((term) => term.length >= 3 && term !== "Empresa sem nome");

  return Array.from(new Set(terms)).slice(0, 3);
};

export const buildEconodataSearchUrl = (searchTerm: string) =>
  `https://www.econodata.com.br/consulta-empresa?searchWord=${encodeURIComponent(
    searchTerm.replace(/\s+/g, "-"),
  )}`;

export const isValidCnpjDigits = (digits: string) => {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  const calcDigit = (base: string, weights: number[]) => {
    const sum = weights.reduce(
      (total, weight, index) => total + Number(base[index]) * weight,
      0,
    );
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const secondDigit = calcDigit(
    digits.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return digits.endsWith(`${firstDigit}${secondDigit}`);
};

export const normalizeWebsiteUrl = (rawWebsite?: string | null) => {
  if (!rawWebsite || rawWebsite === "-") return "-";

  const website = rawWebsite.trim();
  if (!website || website.startsWith("tel:") || website.startsWith("mailto:")) {
    return "-";
  }

  if (website.startsWith("http://") || website.startsWith("https://")) {
    return website;
  }

  return `https://${website}`;
};

export const sanitizeLead = (lead: Partial<LocalizeIaLead>): LocalizeIaLead => {
  const website = normalizeWebsiteUrl(lead.website || "-");

  return {
    companyName: lead.companyName || "Empresa sem nome",
    phone: normalizePhone(lead.phone || "-"),
    website,
    cnpj: normalizeCnpj(lead.cnpj || "-"),
    address: lead.address || "-",
    source: lead.source || "Google Maps",
  };
};

export const fallbackLeadFromEntry = (entry: LocalizeIaListEntry) =>
  sanitizeLead({
    companyName: entry.companyName,
    phone:
      buildWhatsAppUrl(entry.phone) !== "-"
        ? buildWhatsAppUrl(entry.phone)
        : entry.phone,
    website: "-",
    cnpj: "-",
    address: entry.address,
    source: entry.source,
  });
