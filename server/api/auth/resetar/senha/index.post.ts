import prisma from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

const passwordResetSendEmailBodySchema = z.object({
  email: emailSchema,
});

// Envia o e-mail para o usuário com o link para redefinir a senha
export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, passwordResetSendEmailBodySchema.parseAsync);

    const tokenExists = await prisma.usuarioSenhaReset.findFirst({
      where: { usuario: { email: body.email } },
      select: { criado: true, usado: true },
      orderBy: { criado: "desc" },
    });

    // Verifica se já existe um token de recuperação de senha válido e se ele foi criado há menos de 2 horas
    if (
      tokenExists &&
      !tokenExists.usado &&
      new Date(tokenExists.criado).getTime() > Date.now() - 2 * 60 * 60 * 1000
    )
      throw new Error(
        "Já existe um token de recuperação de senha válido para este e-mail. Por favor, aguarde 2 horas antes de solicitar novamente."
      );

    const usuario = await prisma.usuario.findFirst({
      where: { email: body.email },
      select: {
        nome: true,
        email: true,
      },
    });

    // Verifica se o usuário existe e se o e-mail está definido
    if (!usuario || !usuario.email)
      throw new Error("Erro ao enviar o e-mail de recuperação de senha");

    // Cria um novo token de recuperação de senha
    const token = crypto.randomBytes(32).toString("hex");
    const tokenData = await prisma.usuarioSenhaReset.create({
      data: {
        token,
        usuario: {
          connect: { email: body.email },
        },
      },
    });
    if (!tokenData || !tokenData.token)
      throw new Error("Erro ao enviar o e-mail de recuperação de senha");

    // Envia o e-mail de recuperação de senha
    const baseUrl = useRuntimeConfig().public.APP_BASE_URL;
    const resetPasswordLink = `${
      process.env.NODE_ENV === "production" ? baseUrl : "http://localhost:3000"
    }/auth/resetar/senha?token=${tokenData.token}`;

    const { sendMail } = useNodeMailer();
    const data = await sendMail({
      from: '"N3TWORK" <pedro.fernandes@nivel3ti.com.br>',
      subject: "N3TWORK - Recuperação de Senha",
      html: templateEmail(usuario.nome, resetPasswordLink),
      to: usuario.email,
    });

    if (!data || data.accepted.length === 0)
      throw new Error("Erro ao enviar o e-mail de recuperação de senha");

    if (data.accepted.length > 0)
      await logger.view(
        event,
        `E-mail de recuperação de senha enviado com sucesso para ${usuario.email}`
      );

    return data.accepted.length > 0;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err.message || "Ocorreu um erro ao enviar o e-mail de recuperação de senha",
    });
  }
});

const templateEmail = (nome: string, link: string) => {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Recuperação de Senha</title>
</head>
<body style="margin:0; padding:0; background-color:#f2f2f2; font-family:Roboto, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding-bottom: 10px;">
              <img src="https://network.nivel3ti.com.br/img/network-s-light.webp" alt="Logo N3TWORK" height="25" style="margin-bottom: 20px;" />
              <h2 style="color:black; font-weight: 800; margin: 0 0 8px 0;">Recuperação de Senha</h2>
              <p style="font-size: 18px; color: #202124; margin: 0; font-weight: 600;">Olá, ${nome}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 10px; color: #5f6368; font-size: 14px;">
              <p style="color: #5f6368;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Para continuar, clique no botão abaixo e crie uma nova senha segura.
              </p>
              <div style="text-align:center; margin: 30px 0;">
                <a href="${link}" target="_blank" style="font-weight: 500; background-color: #79fe96; color: black; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 14px; display: inline-block;">
                  Alterar senha
                </a>
              </div>
              <p style="color: #5f6368;">Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança.</p>
              <div>
                <span style="margin-top: 10px; font-size: 12px; color: #9e9e9e;">Por motivos de segurança, este link expira em 2 horas.</span>
                <br />
                <span style="margin-top: 2px; font-size: 12px; color: #9e9e9e;">Para proteger sua conta, não encaminhe nem compartilhe este e-mail.</span>
              </div>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #9e9e9e; margin-top: 10px;">© ${new Date().getFullYear()} Nivel3 TI - Tecnologia e Inovação - Todos os Direitos Reservados</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
