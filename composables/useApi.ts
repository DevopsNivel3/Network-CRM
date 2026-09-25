import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";

/* 
Função para realizar chamadas à API, usando CSRF e autenticação
CSRF é um token de segurança que é enviado com cada requisição para garantir que ela não seja feita por alguém que não deveria
Autenticação é o processo de verificar se o usuário está logado e se ele tem permissão para acessar determinada página ou recurso
*/
export const useApi = async <T = unknown>(
  url: NitroFetchRequest,
  options?: NitroFetchOptions<NitroFetchRequest> & { key?: string }
): Promise<T> => {
  const { $csrfFetch } = useNuxtApp();
  const { token } = useAuth();
  const authToken = token.value
    ? token.value.startsWith("Bearer ")
      ? token.value
      : `Bearer ${token.value}`
    : undefined;

  if (options?.key) {
    const cachedData = useNuxtData(options.key);
    if (cachedData.data.value) return cachedData.data.value;
  }

  const res = await $csrfFetch<T>(url, {
    ...options,
    responseType: "json",
    headers: {
      ...(authToken ? { Authorization: authToken } : {}),
      ...options?.headers,
    },
  });

  if (options?.key) useNuxtData(options.key).data.value = res;
  return res;
};
