import { skipHydrate } from "pinia";

interface WhatsappTemplate {
  id: number;
  empresa_id: number;
  titulo: string;
  corpo: string;
  criado: string;
  atualizado: string;
}

interface WhatsappInstanceInfo {
  profileName: string | null;
  ownerJid: string | null;
  profilePicUrl: string | null;
  connectionStatus: string | null;
  chatsCount: number;
  contactsCount: number;
  messagesCount: number;
}

interface WhatsappInstanceStatusResponse {
  status: string | null;
  qrcode: string | { base64?: string; code?: string } | null;
  message: string | null;
}

interface IntegracaoResponse {
  id: number;
  empresa_id?: number;
  tipo: string;
  enabled: boolean;
  config?: Record<string, any> | null;
  criado?: string;
  atualizado?: string;
}

type EvolutionApiResponse = Record<string, any>;

export const useIntegracao = defineStore("integracao", () => {
  const setError = (value: string | null) => useErr().setMessage(value);

  const templatesState = reactive({
    data: null as WhatsappTemplate[] | null,
    isLoading: false,
    isSubmitting: false,
  });

  const instanceState = reactive({
    infoData: null as WhatsappInstanceInfo | null,
    statusValue: null as string | null,
    qrcodeValue: null as string | null,
    messageText: null as string | null,
    isLoading: false,
    isSubmitting: false,
  });

  const resolveQrCode = (
    value?: string | { base64?: string; code?: string } | null,
  ) => {
    if (!value) return null;
    if (typeof value === "string") {
      if (value.startsWith("data:image")) return value;
      return `data:image/png;base64,${value}`;
    }
    const base64 = value.base64;
    if (base64) {
      if (base64.startsWith("data:image")) return base64;
      return `data:image/png;base64,${base64}`;
    }
    const code = value.code;
    if (!code) return null;
    if (code.startsWith("data:image")) return code;
    const looksBase64 = /^[A-Za-z0-9+/=]+$/.test(code) && code.length > 100;
    if (!looksBase64) return null;
    return `data:image/png;base64,${code}`;
  };

  const listTemplates = async (force = false) => {
    if (!force && templatesState.data) return templatesState.data;
    templatesState.isLoading = true;
    try {
      const res = await useApi<WhatsappTemplate[]>("/api/whatsapp/templates", {
        method: "GET",
      });
      templatesState.data = res || [];
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      templatesState.isLoading = false;
    }
  };

  const createTemplate = async (titulo: string, corpo: string) => {
    templatesState.isSubmitting = true;
    try {
      const res = await useApi<WhatsappTemplate>("/api/whatsapp/templates", {
        method: "POST",
        body: { titulo, corpo },
      });
      if (res) {
        const current = templatesState.data || [];
        templatesState.data = [res, ...current];
      }
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      templatesState.isSubmitting = false;
    }
  };

  const updateTemplate = async (id: number, titulo: string, corpo: string) => {
    templatesState.isSubmitting = true;
    try {
      const res = await useApi<WhatsappTemplate>(
        `/api/whatsapp/templates/${id}`,
        {
          method: "PATCH",
          body: { titulo, corpo },
        },
      );
      if (res && templatesState.data) {
        templatesState.data = templatesState.data.map((item) =>
          item.id === id ? res : item,
        );
      }
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      templatesState.isSubmitting = false;
    }
  };

  const removeTemplate = async (id: number) => {
    templatesState.isSubmitting = true;
    try {
      const res = await useApi<boolean>(`/api/whatsapp/templates/${id}`, {
        method: "DELETE",
      });
      if (res && templatesState.data) {
        templatesState.data = templatesState.data.filter(
          (item) => item.id !== id,
        );
      }
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      templatesState.isSubmitting = false;
    }
  };

  const createInstance = async () => {
    instanceState.isSubmitting = true;
    try {
      const res = await useApi<IntegracaoResponse>(
        "/api/whatsapp/instance/create",
        {
          method: "POST",
          body: { enabled: true },
        },
      );
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      instanceState.isSubmitting = false;
    }
  };

  const loadStatus = async () => {
    instanceState.isLoading = true;
    try {
      const res = await useApi<WhatsappInstanceStatusResponse>(
        "/api/whatsapp/instance/status",
        {
          method: "GET",
        },
      );
      if (res) {
        instanceState.statusValue = res?.status || null;
        if (res?.qrcode) {
          instanceState.qrcodeValue = resolveQrCode(res?.qrcode) || null;
        } else if (res?.message) {
          instanceState.messageText = res?.message || null;
        }
      }
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      instanceState.isLoading = false;
    }
  };

  const loadQrCode = async () => {
    instanceState.isLoading = true;
    try {
      const res = await useApi<WhatsappInstanceStatusResponse>(
        "/api/whatsapp/instance/qrcode",
        {
          method: "GET",
        },
      );
      if (res) {
        instanceState.statusValue = res?.status || null;
        instanceState.qrcodeValue = resolveQrCode(res?.qrcode) || null;
        instanceState.messageText = res?.message || null;
      }
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      instanceState.isLoading = false;
    }
  };

  const connectInstance = async () => {
    instanceState.isSubmitting = true;
    try {
      const res = await useApi<EvolutionApiResponse>(
        "/api/whatsapp/instance/connect",
        { method: "POST" },
      );
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      instanceState.isSubmitting = false;
    }
  };

  const disconnectInstance = async () => {
    instanceState.isSubmitting = true;
    try {
      const res = await useApi<EvolutionApiResponse>(
        "/api/whatsapp/instance/disconnect",
        { method: "POST" },
      );
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      instanceState.isSubmitting = false;
    }
  };

  const restartInstance = async () => {
    instanceState.isSubmitting = true;
    try {
      const res = await useApi<EvolutionApiResponse>(
        "/api/whatsapp/instance/restart",
        { method: "POST" },
      );
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      instanceState.isSubmitting = false;
    }
  };

  const loadInstanceInfo = async (force = false) => {
    if (!force && instanceState.infoData) return instanceState.infoData;
    instanceState.isLoading = true;
    try {
      const res = await useApi<WhatsappInstanceInfo>(
        "/api/whatsapp/instance/info",
        {
          method: "GET",
        },
      );
      if (res) instanceState.infoData = res;
      return res;
    } catch (err: any) {
      setError(err?.data?.message);
      return null;
    } finally {
      instanceState.isLoading = false;
    }
  };

  const whatsapp = skipHydrate({
    templates: {
      get data() {
        return templatesState.data;
      },
      get isLoading() {
        return templatesState.isLoading;
      },
      get isSubmitting() {
        return templatesState.isSubmitting;
      },
      list: listTemplates,
      create: createTemplate,
      update: updateTemplate,
      remove: removeTemplate,
    },
    instance: {
      get infoData() {
        return instanceState.infoData;
      },
      get statusValue() {
        return instanceState.statusValue;
      },
      get qrcodeValue() {
        return instanceState.qrcodeValue;
      },
      get messageText() {
        return instanceState.messageText;
      },
      get isLoading() {
        return instanceState.isLoading;
      },
      get isSubmitting() {
        return instanceState.isSubmitting;
      },
      create: createInstance,
      status: loadStatus,
      qrcode: loadQrCode,
      connect: connectInstance,
      disconnect: disconnectInstance,
      restart: restartInstance,
      info: loadInstanceInfo,
    },
  });

  return { whatsapp };
});
