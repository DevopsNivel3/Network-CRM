import prisma from "@/lib/prisma";

// Rota para buscar os Estados
export default defineEventHandler(async () => {
  try {
    const estados = await prisma.estado.findMany({
      select: {
        id: true,
        nome: true,
        uf: true,
      },
    });

    const formattedEstados = estados.map((estado) => ({
      value: estado.nome,
      label: estado.nome,
      uf: estado.uf,
      id: estado.id,
    }));

    return formattedEstados;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar os Estados",
    });
  }
});
