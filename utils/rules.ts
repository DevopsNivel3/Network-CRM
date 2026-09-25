import type { FormRules } from "element-plus";
import { isValidCpf } from "@/utils/cpf";

// RegExp's
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phonePattern = /^[0-9]{8,11}$/;
const CPF_CNPJPattern = /^[0-9]{11,14}$/;

export const optionalCpfRule = () => ({
  validator: (_rule: any, value: any, callback: any) => {
    if (!value) return callback();
    if (!isValidCpf(value))
      return callback(new Error("O CPF informado não é válido."));
    return callback();
  },
  trigger: "blur",
});

// Regra para sem espaço branco
export const noWhitespaceRule = (field: string) => ({
  validator: (_rule: any, value: any, callback: any) => {
    if (value && value.toString().trim() === "")
      callback(
        new Error(`O campo ${field} não pode conter apenas espaços em branco.`),
      );
    else callback();
  },
  trigger: "change",
});

// Regra de validação para tipos de imagem JPG, JPEG e PNG
export const imageTypeRule = () => ({
  validator: (_rule: any, value: any, callback: any) => {
    if (!value || typeof value !== "string") return callback();

    const allowedExtensions = ["jpg", "jpeg", "png"];
    const fileExtension = value.split(".").pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension))
      return callback(new Error("A imagem deve ser JPG, JPEG ou PNG."));
    return callback();
  },
  trigger: "change",
});
// Regra para campo obrigatório
export const requiredRule = (field: string) => ({
  required: true,
  validator: (_rule: any, value: any, callback: any) => {
    if (value === undefined || value === null || value.toString().trim() === "")
      callback(new Error(`O campo ${field} é obrigatório.`));
    else callback();
  },
  trigger: "change",
});

// Regra para caractere mínimo
const minLengthRule = (field: string, min: number) => ({
  min,
  message: `A ${field} precisa ter no mínimo ${min} caracteres.`,
  trigger: "change",
});

// Regra para caractere máximo
export const maxLengthRule = (field: string, max: number) => ({
  max,
  message: `O ${field} precisa ter no máximo ${max} caracteres.`,
  trigger: "change",
});

// Regra personalizada usando RegExp
export const patternRule = (
  field: string,
  pattern: RegExp,
  message: string,
) => ({
  pattern,
  message,
  trigger: "change",
});

// Regras do Formulário de Login
export const FormLoginRules: FormRules<FormLogin> = {
  email: [
    requiredRule("E-mail"),
    patternRule("E-mail", emailPattern, "O E-mail informado não é válido."),
  ],
  senha: [requiredRule("Senha"), minLengthRule("Senha", 6)],
};

// Regras da Criação da Empresa
export const FormCreateEmpresaRules: FormRules<FormEmpresaCreate> = {
  nome: [requiredRule("Nome")],
  email: [
    requiredRule("E-mail"),
    patternRule("E-mail", emailPattern, "O E-mail informado não é válido."),
  ],
  contato: [
    requiredRule("Contato"),
    patternRule("Contato", phonePattern, "O Contato precisa ter 8-11 dígitos"),
  ],
  senha: [
    requiredRule("Senha"),
    minLengthRule("Senha", 6),
    patternRule(
      "Senha",
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-]).{6,}$/,
      "A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial.",
    ),
  ],
  permissoes: [requiredRule("Permissões")],
};

// Regras na atualização da Empresa
export const FormUpdateEmpresaRules: FormRules<FormEmpresaCreate> = {
  nome: [requiredRule("Nome")],
  email: [
    requiredRule("E-mail"),
    patternRule("E-mail", emailPattern, "O E-mail informado não é válido."),
  ],
  contato: [
    requiredRule("Contato"),
    patternRule("Contato", phonePattern, "O Contato precisa ter 8-11 dígitos"),
  ],
};

// Regras na atualização do Usuário
export const FormUpdateUsuarioRules: FormRules<FormUsuarioCreate> = {
  nome: [requiredRule("Nome")],
  cpf: [optionalCpfRule()],
  email: [
    requiredRule("E-mail"),
    patternRule("E-mail", emailPattern, "O E-mail informado não é válido."),
  ],
  contato: [
    requiredRule("Contato"),
    patternRule("Contato", phonePattern, "O Contato precisa ter 8-11 dígitos"),
  ],
  senha: [
    minLengthRule("Senha", 6),
    patternRule(
      "Senha",
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-]).{6,}$/,
      "A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial.",
    ),
  ],
  image: [imageTypeRule()],
};

// Regras na criação do Usuário
export const FormCreateUsuarioRules: FormRules<FormUsuarioCreate> = {
  nome: [requiredRule("Nome")],
  cpf: [optionalCpfRule()],
  email: [
    requiredRule("E-mail"),
    patternRule("E-mail", emailPattern, "O E-mail informado não é válido."),
  ],
  contato: [
    requiredRule("Contato"),
    patternRule("Contato", phonePattern, "O Contato precisa ter 8-11 dígitos"),
  ],
  senha: [
    requiredRule("Senha"),
    minLengthRule("Senha", 6),
    patternRule(
      "Senha",
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-]).{6,}$/,
      "A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial.",
    ),
  ],
  image: [imageTypeRule()],
};

// Regras na criação do Lead
export const FormCreateLeadRules: FormRules<FormLeadCreate> = {
  nome_lead: [requiredRule("Razão Social")],
  cpf_cnpj: [
    noWhitespaceRule("CPF/CNPJ"),
    patternRule(
      "CPF/CNPJ",
      CPF_CNPJPattern,
      "O CPF/CNPJ precisa ter 11-14 dígitos",
    ),
  ],
  responsavel: [noWhitespaceRule("Responsável")],
  contato: [
    noWhitespaceRule("Contato"),
    patternRule("Contato", phonePattern, "O Contato precisa ter 8-11 dígitos"),
  ],
  contato_nome: [noWhitespaceRule("Nome")],
  atividade: [noWhitespaceRule("Atividade")],
  num_funcionarios: [noWhitespaceRule("Colaboradores")],
  faturamento: [noWhitespaceRule("Faturamento")],
  observacoes: [noWhitespaceRule("Observações")],
};

// Regras na criação da Oportunidade
export const FormCreateOportunidadeRules: FormRules<FormOportunidadeCreate> = {
  lead_id: [requiredRule("Lead")],
  num_pdvs: [requiredRule("Nº de PDVS")],
  num_lojas: [requiredRule("Nº de Lojas")],
};

export const FormCreateBoardRules: FormRules<FormBoardCreate> = {
  titulo: [requiredRule("Título")],
  descricao: [noWhitespaceRule("Descrição")],
  cor: [requiredRule("Cor")],
  posicao: [requiredRule("Posição")],
  qualificacao: [requiredRule("Qualificação da oportunidade")],
};

// Regras na atualização da Oportunidade
export const FormUpdateOportunidadeRules: FormRules<FormOportunidadeCreate> = {
  tipo: [noWhitespaceRule("Tipo")],
  board_id: [requiredRule("Status")],
  faixa_valor: [requiredRule("Faixa de Valor")],
  num_pdvs: [requiredRule("Nº de PDVS")],
  num_lojas: [requiredRule("Nº de Lojas")],
  infraestrutura: [noWhitespaceRule("Infraestrutura")],
  descricao: [noWhitespaceRule("Descrição")],
  observacoes: [noWhitespaceRule("Observações")],
};

// Regras na criação na Visita da Oportunidade
export const FormCreateVisitaRules: FormRules<FormVisitaCreate> = {
  data_inicio: [
    requiredRule("Data"),
    // {
    //   validator: (_, value, callback) => {
    //     const currentDate = new Date();
    //     const selectedDate = new Date(value);

    //     currentDate.setHours(0, 0, 0, 0);
    //     selectedDate.setHours(0, 0, 0, 0);

    //     if (selectedDate < currentDate)
    //       callback(new Error("A Data de Início não pode ser anterior à data atual."));
    //     else callback();
    //   },
    //   trigger: "change",
    // },
  ],
  hora_inicio: [requiredRule("Horário")],
  localizacao_id: [requiredRule("Endereço")],
  oportunidade_id: [requiredRule("Oportunidade")],
};

// Regras na atualização da conclusão da Visita na Oportunidade
export const FormEndVisitaRules: FormRules<FormVisitaCreate> = {
  latitude: [requiredRule("Latitude")],
  longitude: [requiredRule("Longitude")],
  imagem_src: [requiredRule("Imagem"), imageTypeRule()],
};

// Regras na atualização de reagendamento da Visita na Oportunidade
export const FormReagendarVisitaRules: FormRules<FormVisitaCreate> = {
  data_inicio: [
    requiredRule("Data"),
    // {
    //   validator: (_, value, callback) => {
    //     const currentDate = new Date();
    //     const selectedDate = new Date(value);

    //     currentDate.setHours(0, 0, 0, 0);
    //     selectedDate.setHours(0, 0, 0, 0);

    //     if (selectedDate < currentDate)
    //       callback(new Error("A Data de Início não pode ser anterior à data atual."));
    //     else callback();
    //   },
    //   trigger: "change",
    // },
  ],
  hora_inicio: [requiredRule("Horário")],
  motivo: [requiredRule("Motivo")],
};

// Regras na atualização de cancelamento da Visita na Oportunidade
export const FormCancelVisitaRules: FormRules<FormVisitaCreate> = {
  motivo: [requiredRule("Motivo")],
};
