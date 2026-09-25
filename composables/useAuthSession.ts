interface UserAuthData {
  id: number | null;
  nome: string;
  permissoes: number;
  empresa_nome: string | null;
  empresa_modulos?: unknown;
  avatar?: string;
}

interface LoginCredentials {
  email: string;
  senha: string;
}

// Função para gerenciar a sessão de autenticação
export const useAuthSession = () => {
  const { data, signIn, signOut, status, token } = useAuth();
  const { headerName, csrf } = useCsrf();
  const isAuthenticated = computed(() => status.value === "authenticated");

  const user = reactive<UserAuthData>({
    id: null,
    nome: "Desconhecido",
    permissoes: 0,
    empresa_nome: null,
    empresa_modulos: null,
    avatar: undefined,
  });

  watchEffect(() => {
    user.id = data.value?.user?.id || null;
    user.nome = data.value?.user?.nome || "Desconhecido";
    user.permissoes = data.value?.user?.permissoes || 0;
    user.empresa_nome = data.value?.user?.empresa_nome || null;
    user.empresa_modulos = data.value?.user?.empresa_modulos || null;
    user.avatar = data.value?.user?.avatar
      ? `/uploads${data.value.user.avatar}`
      : undefined;
  });

  // Realiza login no sistema
  const login = async ({ email, senha }: LoginCredentials) => {
    try {
      await signIn(
        { email, senha },
        { callbackUrl: "/crm", redirect: true },
        undefined,
        {
          [headerName]: csrf,
        },
      );
    } catch (err) {
      console.error(err);
      throw new Error("Login não realizado");
    }
  };

  // Realiza logout no sistema
  const logout = async () => {
    try {
      if (import.meta.client && token.value) {
        const codigoSessao = sessionStorage.getItem("presenca_codigo_sessao");
        if (codigoSessao) {
          await useApi("/api/presenca/encerrar", {
            method: "POST",
            body: { codigoSessao },
          });
        }
      }
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    login,
    logout,
    user,
    isAuthenticated,
  };
};
