interface LoginLimitData {
  count: number;
  timestamp: number;
}

// Middleware para limitar o login de um IP em um intervalo de tempo definido (30 segundos)
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname;

  if (url.startsWith("/api/auth/login")) {
    const loginLimit = 5;
    const seconds = 30;

    const forwardedFor = getRequestIP(event);
    const ip = forwardedFor || "127.0.0.1";

    const storage = useStorage("loginlimit");
    const loginLimitKey = `loginlimit:${ip}`;

    const data = ((await storage.getItem(loginLimitKey)) as LoginLimitData) || {
      count: 0,
      timestamp: Date.now(),
    };

    const currentTime = Date.now();

    if (currentTime - data.timestamp > seconds * 1000) {
      data.count = 0;
      data.timestamp = currentTime;
    }

    if (data.count >= loginLimit) {
      throw createError({
        statusCode: 429,
        message: "Limite de requisições excedido. Tente novamente mais tarde.",
      });
    }

    data.count++;
    await storage.setItem(loginLimitKey, data);

    console.log(`IP ${ip} fez ${data.count}/${loginLimit} requisições.`);
  }
});
