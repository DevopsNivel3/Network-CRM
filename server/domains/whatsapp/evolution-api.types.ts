// Evolution API types
export interface ApiInfo {
  status: number;
  message: string;
  version: string;
  clientName?: string;
  manager?: string;
  documentation?: string;
}

export interface QrCode {
  count?: number;
  pairingCode?: string;
  base64?: string;
  code?: string;
}

export interface InstanceStatus {
  instance?: {
    instanceName?: string;
    state?: string;
  };
  qrcode?: QrCode;
  status?: string;
  message?: string;
  error?: boolean;
}

export interface QuotedMessage {
  key: {
    id: string;
    remoteJid?: string;
    fromMe?: boolean;
    participant?: string;
  };
  message?: unknown;
}

export interface MessageOptions {
  delay?: number;
  presence?: "available" | "unavailable" | "composing" | "recording" | "paused";
  quoted?: QuotedMessage;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  mentionedList?: string[];
  everyOne?: boolean;
  encoding?: boolean;
  webhookUrl?: string;
}

export interface SendTextMessageRequest extends MessageOptions {
  number: string;
  text: string;
  options?: MessageOptions;
}

export interface SendTextMessageResponse {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation: string;
  };
  messageTimestamp: number;
  status: string;
}

export interface CheckNumberRequest {
  numbers: string[];
}

export interface CheckNumberResponse {
  numbers: Array<{
    jid: string;
    exists: boolean;
    number: string;
    name?: string;
  }>;
}

export interface Contact {
  id: string;
  name?: string;
  pushname?: string;
  shortName?: string;
  isMe?: boolean;
  isGroup?: boolean;
}

export interface Chat {
  id: string;
  name?: string;
  lastMessage?: {
    text?: string;
    timestamp?: number;
  };
  unreadCount?: number;
  isGroup?: boolean;
}

export interface Query<T = any> {
  where?: T;
  sort?: "asc" | "desc";
  page?: number;
  offset?: number;
}

export interface ReadMessageKey {
  id: string;
  fromMe: boolean;
  remoteJid: string;
  participant?: string;
}

export interface ReadMessageRequest {
  readMessages: ReadMessageKey[];
}

export interface ArchiveChatRequest {
  archive: boolean;
  chat?: string;
  lastMessage?: {
    key: ReadMessageKey;
    messageTimestamp?: number;
  };
}

export interface DeleteMessageRequest extends ReadMessageKey {}

export interface UpdateMessageRequest extends MessageOptions {
  number: string;
  key: ReadMessageKey;
  text: string;
  options?: MessageOptions;
}

export interface SendPresenceRequest {
  number: string;
  presence: "available" | "unavailable" | "composing" | "recording" | "paused";
  delay?: number;
}

export interface SendTemplateRequest extends MessageOptions {
  number: string;
  name: string;
  language: string;
  components: any;
  webhookUrl?: string;
  options?: MessageOptions;
}

export type MediaType = "image" | "document" | "video" | "audio";

export interface SendMediaRequest extends MessageOptions {
  number: string;
  mediatype: MediaType;
  media: string;
  mimetype?: string;
  caption?: string;
  fileName?: string;
  options?: MessageOptions;
}

export interface SendAudioRequest extends MessageOptions {
  number: string;
  audio: string;
  options?: MessageOptions;
}

export interface SendStickerRequest extends MessageOptions {
  number: string;
  sticker: string;
  options?: MessageOptions;
}

export interface SendLocationRequest extends MessageOptions {
  number: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  options?: MessageOptions;
}

export interface ContactMessage {
  fullName: string;
  wuid: string;
  phoneNumber: string;
  organization?: string;
  email?: string;
  url?: string;
}

export interface SendContactRequest extends MessageOptions {
  number: string;
  contact: ContactMessage[];
  options?: MessageOptions;
}

export interface SendReactionRequest {
  key: {
    id: string;
    remoteJid: string;
    fromMe?: boolean;
    participant?: string;
  };
  reaction: string;
}

export interface SendPollRequest extends MessageOptions {
  number: string;
  name: string;
  selectableCount: number;
  values: string[];
  messageSecret?: Uint8Array;
  options?: MessageOptions;
}

export interface SendListRequest extends MessageOptions {
  number: string;
  title: string;
  description?: string;
  footerText?: string;
  buttonText: string;
  sections: ListSection[];
  options?: MessageOptions;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListRow {
  rowId: string;
  title: string;
  description?: string;
}

export interface SendStatusRequest extends MessageOptions {
  type: "text" | "image" | "video" | "audio";
  content: string;
  statusJidList?: string[];
  allContacts?: boolean;
  caption?: string;
  backgroundColor?: string;
  font?: number;
  options?: MessageOptions;
}

export interface ProfileInfo {
  wuid?: string;
  name?: string;
  numberExists?: boolean;
  picture?: string | null;
  status?: string | null;
  isBusiness?: boolean;
  email?: string | null;
  description?: string | null;
  website?: string | null;
}

export interface PrivacySettings {
  readreceipts: "all" | "none";
  profile: "all" | "contacts" | "contact_blacklist" | "none";
  status: "all" | "contacts" | "contact_blacklist" | "none";
  online: "all" | "contacts" | "contact_blacklist" | "none";
  last: "all" | "contacts" | "contact_blacklist" | "none";
  groupadd: "all" | "contacts" | "contact_blacklist" | "none";
}

export interface CreateGroupRequest {
  subject: string;
  participants: string[];
  description?: string;
  profilePicture?: string;
  promoteParticipants?: boolean;
}

export interface GroupInfo {
  id: string;
  subject: string;
  description?: string;
  owner?: string;
  participants: GroupParticipant[];
  creation?: number;
  ephemeralDuration?: number;
}

export interface GroupParticipant {
  id: string;
  admin?: "admin" | "superadmin" | null;
  isSuperAdmin?: boolean;
}

export interface GroupUpdateRequest {
  groupJid: string;
  action: "add" | "remove" | "promote" | "demote";
  participants: string[];
}

export interface GroupSettingRequest {
  groupJid: string;
  action: "announcement" | "not_announcement" | "locked" | "unlocked";
}

export interface WebhookConfig {
  url: string;
  enabled: boolean;
  headers?: Record<string, string>;
  byEvents?: boolean;
  base64?: boolean;
  events?: WebhookEvent[];
}

export type WebhookEvent =
  | "APPLICATION_STARTUP"
  | "QRCODE_UPDATED"
  | "MESSAGES_SET"
  | "MESSAGES_UPSERT"
  | "MESSAGES_EDITED"
  | "MESSAGES_UPDATE"
  | "MESSAGES_DELETE"
  | "SEND_MESSAGE"
  | "CONTACTS_SET"
  | "CONTACTS_UPSERT"
  | "CONTACTS_UPDATE"
  | "PRESENCE_UPDATE"
  | "CHATS_SET"
  | "CHATS_UPSERT"
  | "CHATS_UPDATE"
  | "CHATS_DELETE"
  | "GROUPS_UPSERT"
  | "GROUP_UPDATE"
  | "GROUP_PARTICIPANTS_UPDATE"
  | "CONNECTION_UPDATE"
  | "LABELS_EDIT"
  | "LABELS_ASSOCIATION"
  | "CALL"
  | "TYPEBOT_START"
  | "TYPEBOT_CHANGE_STATUS"
  | "REMOVE_INSTANCE"
  | "LOGOUT_INSTANCE";

export interface InstanceConfig {
  instanceName?: string;
  integration?: "WHATSAPP-BAILEYS" | "WHATSAPP-BUSINESS" | "EVOLUTION";
  token?: string;
  qrcode?: boolean;
  number?: string;
  businessId?: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
  wavoipToken?: string;
  proxyHost?: string;
  proxyPort?: string;
  proxyProtocol?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  webhook?: WebhookConfig;
  websocket?: { enabled?: boolean; events?: WebhookEvent[] };
  rabbitmq?: { enabled?: boolean; events?: WebhookEvent[] };
  sqs?: { enabled?: boolean; events?: WebhookEvent[] };
  chatwootAccountId?: string;
  chatwootToken?: string;
  chatwootUrl?: string;
  chatwootSignMsg?: boolean;
  chatwootReopenConversation?: boolean;
  chatwootConversationPending?: boolean;
  chatwootImportContacts?: boolean;
  chatwootNameInbox?: string;
  chatwootMergeBrazilContacts?: boolean;
  chatwootImportMessages?: boolean;
  chatwootDaysLimitImportMessages?: number;
  settings?: {
    rejectCall?: boolean;
    msgCall?: string;
    groupsIgnore?: boolean;
    alwaysOnline?: boolean;
    readMessages?: boolean;
    readStatus?: boolean;
    syncFullHistory?: boolean;
    wavoipToken?: string;
  };
}

export interface EvolutionApiConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}
