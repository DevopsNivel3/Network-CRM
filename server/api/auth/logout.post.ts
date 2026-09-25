// Rota para logout do usuário
export default defineEventHandler(async (event) => {
  try {
    setCookie(event, "auth.token", "", {
      expires: new Date(0),
    });

    await logger.view(event, "Logout realizado com sucesso");

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err.message || "Ocorreu um erro ao realizar logout",
    });
  }
});
