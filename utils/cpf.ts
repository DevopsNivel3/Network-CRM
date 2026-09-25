export const normalizeCpf = (value: unknown): string =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);

export const isValidCpf = (value: unknown): boolean => {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (length: number): number => {
    let sum = 0;

    for (let index = 0; index < length; index += 1)
      sum += Number(cpf[index]) * (length + 1 - index);

    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateDigit(9) === Number(cpf[9]) &&
    calculateDigit(10) === Number(cpf[10])
  );
};
