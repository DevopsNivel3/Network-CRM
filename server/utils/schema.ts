import z from "zod";
import { isValidCpf, normalizeCpf } from "@/utils/cpf";

export const createStringSchema = (field: string) =>
  z.string({ message: `${field} é necessário` });

export const createNumberSchema = (field: string) =>
  z.any({ message: `${field} é necessário` }).transform((value) => {
    const parsed = Number(value);
    if (isNaN(parsed)) throw new Error(`${field} não é válido`);
    return parsed;
  });

export const emailSchema = createStringSchema("E-mail").regex(
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  "E-mail inválido",
);

export const senhaSchema = createStringSchema("Senha").min(
  6,
  "A senha precisa ter no mínimo 6 caracteres",
);

export const cpfSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;

  const cpf = normalizeCpf(value);
  return cpf || null;
}, z.string().refine(isValidCpf, "CPF inválido").nullable().optional());

export const pageSchema = createNumberSchema("Página").default("1");
export const perPageSchema =
  createNumberSchema("Total por página").default("100");

export const idParamSchema = z.object({
  id: createNumberSchema("Id"),
});
