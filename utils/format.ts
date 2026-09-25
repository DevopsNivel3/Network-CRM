// Formata o CEP (00000-000)
export const formatCep = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");

  if (value.length <= 5) return value;
  return `${value.slice(0, 5)}-${value.slice(5, 8)}`;
};

// Formata o número de telefone (00 0000-0000)
export const formatPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  value = value.slice(0, 11);

  if (value.length <= 4) return value;
  if (value.length <= 6) return `${value.slice(0, 2)} ${value.slice(2)}`;
  if (value.length <= 8) return `${value.slice(0, 4)}-${value.slice(4)}`;
  if (value.length <= 10)
    return `${value.slice(0, 2)} ${value.slice(2, 6)}-${value.slice(6)}`;

  return `${value.slice(0, 2)} ${value.slice(2, 7)}-${value.slice(7)}`;
};

// Converte para link tel:
export const toTel = (value?: string | number | null) =>
  (() => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits ? `tel:${digits}` : "";
  })();

// Converte para link mailto:
export const toMail = (value?: string | null) =>
  `mailto:${String(value ?? "").trim()}`;

// Formata o CPF/CPNJ (000.000.000-00 / 00.000.000/0001-00)
export const formatCPF_CNPJ = (value: string) => {
  if (!value) return "";

  value = value.replace(/\D/g, "");
  value = value.slice(0, 14);

  if (value.length <= 11) {
    if (value.length <= 3) return value;
    if (value.length <= 6) return `${value.slice(0, 3)}.${value.slice(3)}`;
    if (value.length <= 9)
      return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
  }

  if (value.length <= 2) return value;
  if (value.length <= 5) return `${value.slice(0, 2)}.${value.slice(2)}`;
  if (value.length <= 8)
    return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
  if (value.length <= 12)
    return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;

  return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(
    8,
    12,
  )}-${value.slice(12)}`;
};

// Formata o número adicionando ponto (1.000)
export const formatNumber = (value: string) => {
  if (!value) return "";
  return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
