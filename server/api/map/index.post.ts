import { z } from "zod";

const mapBodySchema = z.object({
  latitude: z.number({ message: "Latitude é necessária" }).transform(String),
  longitude: z.number({ message: "Longitude é necessária" }).transform(String),
});

// Rota para buscar o endereço pelo GPS
export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, mapBodySchema.parseAsync);

    const res: any = await $fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${body.latitude}+${body.longitude}&key=${process.env.GEO_API_KEY}`
    );
    if (!res.results && res.results.length <= 0)
      throw new Error("Nenhum endereço encontrado para as coordenadas fornecidas");

    const result = res.results[0].components;
    return {
      rua: result.road,
      cidade: result.city,
      estado: result.state,
      numero: Number(result.house_number || 0),
      cep: result.postcode,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar o Endereço pelo GPS",
    });
  }
});
