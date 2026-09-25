// Rota para buscar os dados do usuário
export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth;
    return {
      user: {
        id: auth.id,
        nome: auth.nome,
        empresa_nome: auth.empresa.nome,
        empresa_modulos: auth.empresa.modulos,
        permissoes: auth.permissoes,
        avatar: auth.avatar,
      },
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err.message || "Ocorreu um erro ao buscar os dados do usuário",
    });
  }
});
