const removedApiPrefixes = ["/api/users", "/api/opportunitys"];

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;
  const isRemovedApi = removedApiPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!isRemovedApi) return;

  throw createError({
    statusCode: 410,
    message: "Endpoint removido. Use a API atual em português.",
  });
});
