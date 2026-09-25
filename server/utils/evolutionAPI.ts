import axios, { type AxiosInstance, isAxiosError } from "axios";

export {
  getPhoneVariants,
  normalizeFromJid,
  normalizePhone,
  normalizePhoneFromJid,
} from "../domains/whatsapp/phone-normalization";
export { extractMessageText } from "../domains/whatsapp/message.utils";
export { getEmpresaWhatsappIntegracao } from "../domains/whatsapp/integration.repository";

import type {
  ApiInfo,
  QrCode,
  InstanceStatus,
  QuotedMessage,
  MessageOptions,
  SendTextMessageRequest,
  SendTextMessageResponse,
  CheckNumberRequest,
  CheckNumberResponse,
  Contact,
  Chat,
  Query,
  ReadMessageKey,
  ReadMessageRequest,
  ArchiveChatRequest,
  DeleteMessageRequest,
  UpdateMessageRequest,
  SendPresenceRequest,
  SendTemplateRequest,
  MediaType,
  SendMediaRequest,
  SendAudioRequest,
  SendStickerRequest,
  SendLocationRequest,
  ContactMessage,
  SendContactRequest,
  SendReactionRequest,
  SendPollRequest,
  SendListRequest,
  ListSection,
  ListRow,
  SendStatusRequest,
  ProfileInfo,
  PrivacySettings,
  CreateGroupRequest,
  GroupInfo,
  GroupParticipant,
  GroupUpdateRequest,
  GroupSettingRequest,
  WebhookConfig,
  WebhookEvent,
  InstanceConfig,
  EvolutionApiConfig,
} from "../domains/whatsapp/evolution-api.types";

export type {
  ApiInfo,
  QrCode,
  InstanceStatus,
  QuotedMessage,
  MessageOptions,
  SendTextMessageRequest,
  SendTextMessageResponse,
  CheckNumberRequest,
  CheckNumberResponse,
  Contact,
  Chat,
  Query,
  ReadMessageKey,
  ReadMessageRequest,
  ArchiveChatRequest,
  DeleteMessageRequest,
  UpdateMessageRequest,
  SendPresenceRequest,
  SendTemplateRequest,
  MediaType,
  SendMediaRequest,
  SendAudioRequest,
  SendStickerRequest,
  SendLocationRequest,
  ContactMessage,
  SendContactRequest,
  SendReactionRequest,
  SendPollRequest,
  SendListRequest,
  ListSection,
  ListRow,
  SendStatusRequest,
  ProfileInfo,
  PrivacySettings,
  CreateGroupRequest,
  GroupInfo,
  GroupParticipant,
  GroupUpdateRequest,
  GroupSettingRequest,
  WebhookConfig,
  WebhookEvent,
  InstanceConfig,
  EvolutionApiConfig,
} from "../domains/whatsapp/evolution-api.types";

const normalizeUrl = (url: string) => url.replace(/\/+$/, "");

const getEvolutionEnv = () => {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_TOKEN;
  if (!apiUrl || !apiKey) {
    throw new Error("EVOLUTION_API_URL e EVOLUTION_API_TOKEN não configurados");
  }
  return { apiUrl, apiKey };
};

export class EvolutionApiService {
  private instanceName: string;
  private client: AxiosInstance;

  constructor(instanceName: string, apiUrl?: string, apiKey?: string) {
    const env = getEvolutionEnv();
    const baseUrl = normalizeUrl(apiUrl || env.apiUrl);
    const key = apiKey || env.apiKey;
    this.instanceName = instanceName;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
        apikey: key,
      },
    });
  }

  private async request<T>(path: string, options: any = {}) {
    const method = (options.method || "GET").toLowerCase();
    try {
      const response = await this.client.request<T>({
        url: path,
        method,
        data: options.body,
        headers: options.headers,
      });
      return response.data;
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;
        const detail =
          typeof data === "string" ? data : JSON.stringify(data || {});
        const code = err.code ? ` code=${err.code}` : "";
        const message = err.message ? ` message=${err.message}` : "";
        const url = err.config
          ? `${err.config.baseURL || ""}${err.config.url || ""}`
          : "";
        const target = url ? ` url=${url}` : "";
        throw new Error(
          `Evolution API error (${status ?? "unknown"}): ${detail}${code}${message}${target}`,
        );
      }
      throw err;
    }
  }

  private withInstance(path: string) {
    return `${path}/${encodeURIComponent(this.instanceName)}`;
  }

  private normalizeMessagePayload<T extends { options?: MessageOptions }>(
    data: T,
  ) {
    const { options, ...rest } = data || ({} as T);
    const payload: Record<string, any> = options
      ? { ...options, ...rest }
      : { ...rest };

    if (payload.mentionedList && !payload.mentioned) {
      payload.mentioned = payload.mentionedList;
    }
    if (
      payload.everyOne !== undefined &&
      payload.mentionsEveryOne === undefined
    ) {
      payload.mentionsEveryOne = payload.everyOne;
    }

    delete payload.mentionedList;
    delete payload.everyOne;

    return payload as T;
  }

  async getApiInfo(): Promise<ApiInfo> {
    return this.request<ApiInfo>(`/`);
  }

  async getInstanceStatus(): Promise<InstanceStatus> {
    return this.request<InstanceStatus>(
      this.withInstance(`/instance/connectionState`),
    );
  }

  async createInstance(instanceName: string, config?: InstanceConfig) {
    const { settings, ...rest } = config || {};
    const normalizedSettings: Record<string, any> = {};
    if (settings) {
      const legacy = settings as Record<string, any>;
      normalizedSettings.rejectCall = settings.rejectCall ?? legacy.reject_call;
      normalizedSettings.msgCall = settings.msgCall ?? legacy.msg_call;
      normalizedSettings.groupsIgnore =
        settings.groupsIgnore ?? legacy.groups_ignore;
      normalizedSettings.alwaysOnline =
        settings.alwaysOnline ?? legacy.always_online;
      normalizedSettings.readMessages =
        settings.readMessages ?? legacy.read_messages;
      normalizedSettings.readStatus = settings.readStatus ?? legacy.read_status;
      normalizedSettings.syncFullHistory =
        settings.syncFullHistory ?? legacy.sync_full_history;
      normalizedSettings.wavoipToken =
        settings.wavoipToken ?? legacy.wavoip_token;
    }
    return this.request<any>(`/instance/create`, {
      method: "POST",
      body: {
        instanceName,
        ...rest,
        ...normalizedSettings,
      },
    });
  }

  async deleteInstance() {
    return this.request<any>(this.withInstance(`/instance/delete`), {
      method: "DELETE",
    });
  }

  async restartInstance() {
    return this.request<any>(this.withInstance(`/instance/restart`), {
      method: "POST",
    });
  }

  async setPresence(
    presence:
      "available" | "unavailable" | "composing" | "recording" | "paused",
  ) {
    return this.request<any>(this.withInstance(`/instance/setPresence`), {
      method: "POST",
      body: { presence },
    });
  }

  async logout() {
    return this.request<any>(this.withInstance(`/instance/logout`), {
      method: "DELETE",
    });
  }

  async setWebhook(webhook: WebhookConfig & { webhookUrl?: string }) {
    const payload = {
      webhook: {
        enabled: webhook.enabled,
        url: webhook.url ?? webhook.webhookUrl,
        headers: webhook.headers,
        byEvents: webhook.byEvents ?? false,
        base64: webhook.base64 ?? false,
        events: webhook.events,
      },
    };
    return this.request<any>(this.withInstance(`/webhook/set`), {
      method: "POST",
      body: payload,
    });
  }

  async getWebhook() {
    return this.request<any>(this.withInstance(`/webhook/find`));
  }

  async connectInstance() {
    return this.request<any>(this.withInstance(`/instance/connect`));
  }

  async setSettings(settings: any) {
    return this.request<any>(this.withInstance(`/settings/set`), {
      method: "POST",
      body: settings,
    });
  }

  async getSettings() {
    return this.request<any>(this.withInstance(`/settings/find`));
  }

  async sendTextMessage({ number, text, options }: SendTextMessageRequest) {
    const payload = this.normalizeMessagePayload({
      number,
      text,
      ...(options ? { options } : {}),
    });
    return this.request<SendTextMessageResponse>(
      this.withInstance(`/message/sendText`),
      {
        method: "POST",
        body: payload,
      },
    );
  }

  async sendTemplate(data: SendTemplateRequest) {
    return this.request<any>(this.withInstance(`/message/sendTemplate`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendStatus(data: SendStatusRequest) {
    return this.request<any>(this.withInstance(`/message/sendStatus`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendMedia(data: SendMediaRequest) {
    return this.request<any>(this.withInstance(`/message/sendMedia`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendAudio(data: SendAudioRequest) {
    return this.request<any>(this.withInstance(`/message/sendWhatsAppAudio`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendSticker(data: SendStickerRequest) {
    return this.request<any>(this.withInstance(`/message/sendSticker`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendLocation(data: SendLocationRequest) {
    return this.request<any>(this.withInstance(`/message/sendLocation`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendContact(data: SendContactRequest) {
    return this.request<any>(this.withInstance(`/message/sendContact`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendReaction(data: SendReactionRequest) {
    return this.request<any>(this.withInstance(`/message/sendReaction`), {
      method: "POST",
      body: data,
    });
  }

  async sendPoll(data: SendPollRequest) {
    return this.request<any>(this.withInstance(`/message/sendPoll`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async sendList(data: SendListRequest) {
    return this.request<any>(this.withInstance(`/message/sendList`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async checkWhatsAppNumber(input: CheckNumberRequest | string | string[]) {
    const numbers = Array.isArray(input)
      ? input
      : typeof input === "string"
        ? [input]
        : input.numbers;
    return this.request<CheckNumberResponse>(
      this.withInstance(`/chat/whatsappNumbers`),
      {
        method: "POST",
        body: { numbers },
      },
    );
  }

  async markMessageAsRead(readMessages: ReadMessageKey[] | ReadMessageRequest) {
    const payload = Array.isArray(readMessages)
      ? { readMessages }
      : readMessages;
    return this.request<any>(this.withInstance(`/chat/markMessageAsRead`), {
      method: "POST",
      body: payload,
    });
  }

  async archiveChat(data: ArchiveChatRequest) {
    return this.request<any>(this.withInstance(`/chat/archiveChat`), {
      method: "POST",
      body: data,
    });
  }

  async deleteMessageForEveryone(data: DeleteMessageRequest) {
    return this.request<any>(
      this.withInstance(`/chat/deleteMessageForEveryone`),
      { method: "DELETE", body: data },
    );
  }

  async sendPresence(data: SendPresenceRequest) {
    return this.request<any>(this.withInstance(`/chat/sendPresence`), {
      method: "POST",
      body: data,
    });
  }

  async fetchProfilePictureUrl(number: string) {
    return this.request<any>(
      this.withInstance(`/chat/fetchProfilePictureUrl`),
      {
        method: "POST",
        body: { number },
      },
    );
  }

  async fetchContacts(query?: Query<Contact>) {
    return this.request<{ data: Contact[] }>(
      this.withInstance(`/chat/findContacts`),
      { method: "POST", body: query || {} },
    );
  }

  async fetchInstances(params?: {
    instanceName?: string;
    instanceId?: string;
    number?: string;
  }) {
    const resolvedParams = params ?? { instanceName: this.instanceName };
    const queryParams = new URLSearchParams();
    if (resolvedParams.instanceName)
      queryParams.set("instanceName", resolvedParams.instanceName);
    if (resolvedParams.instanceId)
      queryParams.set("instanceId", resolvedParams.instanceId);
    if (resolvedParams.number) queryParams.set("number", resolvedParams.number);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<any>(`/instance/fetchInstances${query}`);
  }

  async findMessages(query?: Query<any>) {
    return this.request<any>(this.withInstance(`/chat/findMessages`), {
      method: "POST",
      body: query || {},
    });
  }

  async findStatusMessages(query?: Query<any>) {
    return this.request<any>(this.withInstance(`/chat/findStatusMessage`), {
      method: "POST",
      body: query || {},
    });
  }

  async updateMessage(data: UpdateMessageRequest) {
    return this.request<any>(this.withInstance(`/chat/updateMessage`), {
      method: "POST",
      body: this.normalizeMessagePayload(data),
    });
  }

  async fetchChats(query?: Query<Chat>) {
    return this.request<{ data: Chat[] }>(
      this.withInstance(`/chat/findChats`),
      {
        method: "POST",
        body: query || {},
      },
    );
  }

  async fetchBusinessProfile(number?: string) {
    return this.request<any>(this.withInstance(`/chat/fetchBusinessProfile`), {
      method: "POST",
      body: number ? { number } : {},
    });
  }

  async fetchProfile(number?: string): Promise<ProfileInfo> {
    return this.request<ProfileInfo>(this.withInstance(`/chat/fetchProfile`), {
      method: "POST",
      body: number ? { number } : {},
    });
  }

  async updateProfileName(name: string) {
    return this.request<any>(this.withInstance(`/chat/updateProfileName`), {
      method: "POST",
      body: { name },
    });
  }

  async updateProfileStatus(status: string) {
    return this.request<any>(this.withInstance(`/chat/updateProfileStatus`), {
      method: "POST",
      body: { status },
    });
  }

  async updateProfilePicture(picture: string) {
    return this.request<any>(this.withInstance(`/chat/updateProfilePicture`), {
      method: "POST",
      body: { picture },
    });
  }

  async removeProfilePicture() {
    return this.request<any>(this.withInstance(`/chat/removeProfilePicture`), {
      method: "DELETE",
    });
  }

  async fetchPrivacySettings(): Promise<PrivacySettings> {
    return this.request<PrivacySettings>(
      this.withInstance(`/chat/fetchPrivacySettings`),
    );
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>) {
    return this.request<any>(this.withInstance(`/chat/updatePrivacySettings`), {
      method: "POST",
      body: settings,
    });
  }

  async createGroup(data: CreateGroupRequest) {
    return this.request<any>(this.withInstance(`/group/create`), {
      method: "POST",
      body: data,
    });
  }

  async updateGroupPicture(groupId: string, image: string) {
    return this.request<any>(this.withInstance(`/group/updateGroupPicture`), {
      method: "POST",
      body: { groupJid: groupId, image },
    });
  }

  async updateGroupSubject(groupId: string, subject: string) {
    return this.request<any>(this.withInstance(`/group/updateGroupSubject`), {
      method: "POST",
      body: { groupJid: groupId, subject },
    });
  }

  async updateGroupDescription(groupId: string, description: string) {
    return this.request<any>(
      this.withInstance(`/group/updateGroupDescription`),
      {
        method: "POST",
        body: { groupJid: groupId, description },
      },
    );
  }

  async fetchInviteCode(groupId: string) {
    const query = `?groupJid=${encodeURIComponent(groupId)}`;
    return this.request<any>(this.withInstance(`/group/inviteCode${query}`));
  }

  async acceptInviteCode(code: string) {
    const query = `?inviteCode=${encodeURIComponent(code)}`;
    return this.request<any>(
      this.withInstance(`/group/acceptInviteCode${query}`),
    );
  }

  async revokeInviteCode(groupId: string) {
    return this.request<any>(this.withInstance(`/group/revokeInviteCode`), {
      method: "POST",
      body: { groupJid: groupId },
    });
  }

  async sendGroupInvite(
    groupId: string,
    numbers: string[],
    description: string,
  ) {
    return this.request<any>(this.withInstance(`/group/sendInvite`), {
      method: "POST",
      body: { groupJid: groupId, numbers, description },
    });
  }

  async findGroupByInviteCode(code: string) {
    const query = `?inviteCode=${encodeURIComponent(code)}`;
    return this.request<any>(this.withInstance(`/group/inviteInfo${query}`));
  }

  async findGroupByJid(groupId: string): Promise<GroupInfo> {
    const query = `?groupJid=${encodeURIComponent(groupId)}`;
    return this.request<GroupInfo>(
      this.withInstance(`/group/findGroupInfos${query}`),
    );
  }

  async fetchAllGroups(getParticipants: "true" | "false" | boolean = "false") {
    const value =
      typeof getParticipants === "boolean"
        ? getParticipants
          ? "true"
          : "false"
        : getParticipants;
    const query = `?getParticipants=${encodeURIComponent(value)}`;
    return this.request<{ data: GroupInfo[] }>(
      this.withInstance(`/group/fetchAllGroups${query}`),
    );
  }

  async findGroupMembers(groupId: string) {
    const query = `?groupJid=${encodeURIComponent(groupId)}`;
    return this.request<any>(this.withInstance(`/group/participants${query}`));
  }

  async updateGroupMembers(data: GroupUpdateRequest) {
    return this.request<any>(this.withInstance(`/group/updateParticipant`), {
      method: "POST",
      body: data,
    });
  }

  async updateGroupSetting(data: GroupSettingRequest) {
    return this.request<any>(this.withInstance(`/group/updateSetting`), {
      method: "POST",
      body: data,
    });
  }

  async toggleEphemeral(groupId: string, expiration: number) {
    return this.request<any>(this.withInstance(`/group/toggleEphemeral`), {
      method: "POST",
      body: { groupJid: groupId, expiration },
    });
  }

  async leaveGroup(groupId: string) {
    const query = `?groupJid=${encodeURIComponent(groupId)}`;
    return this.request<any>(this.withInstance(`/group/leaveGroup${query}`), {
      method: "DELETE",
    });
  }
}
