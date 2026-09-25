const STORAGE_KEY = "presenca_codigo_sessao";
const HEARTBEAT_INTERVAL = 30_000;

const getCodigoSessao = () => {
  const fromStorage = sessionStorage.getItem(STORAGE_KEY);
  if (fromStorage) return fromStorage;

  const novoCodigo = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, novoCodigo);
  return novoCodigo;
};

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const { status } = useAuth();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const iniciar = async () => {
    if (status.value !== "authenticated") return;

    const codigoSessao = getCodigoSessao();
    try {
      await useApi("/api/presenca/iniciar", {
        method: "POST",
        body: {
          codigoSessao,
          paginaAtual: window.location.pathname,
        },
      });
    } catch {}
  };

  const heartbeat = async () => {
    if (status.value !== "authenticated") return;

    const codigoSessao = sessionStorage.getItem(STORAGE_KEY);
    if (!codigoSessao) return;

    try {
      await useApi("/api/presenca/heartbeat", {
        method: "POST",
        body: {
          codigoSessao,
          paginaAtual: window.location.pathname,
        },
      });
    } catch {}
  };

  const encerrar = async () => {
    if (status.value !== "authenticated") return;

    const codigoSessao = sessionStorage.getItem(STORAGE_KEY);
    if (!codigoSessao) return;

    try {
      await useApi("/api/presenca/encerrar", {
        method: "POST",
        body: { codigoSessao },
      });
    } catch {}
  };

  const encerrarComBeacon = () => {
    if (status.value !== "authenticated") return;

    const codigoSessao = sessionStorage.getItem(STORAGE_KEY);
    if (!codigoSessao) return;

    const blob = new Blob([JSON.stringify({ codigoSessao })], {
      type: "application/json",
    });
    navigator.sendBeacon("/api/presenca/encerrar", blob);
  };

  watch(
    () => status.value,
    (newStatus, oldStatus) => {
      if (newStatus === "authenticated") {
        iniciar();
        heartbeat();
        if (!intervalId) intervalId = setInterval(heartbeat, HEARTBEAT_INTERVAL);
      }

      if (oldStatus === "authenticated" && newStatus !== "authenticated") {
        encerrar();
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    },
    { immediate: true },
  );

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") heartbeat();
  });

  window.addEventListener("beforeunload", encerrarComBeacon);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      window.removeEventListener("beforeunload", encerrarComBeacon);
    });
  }
});
