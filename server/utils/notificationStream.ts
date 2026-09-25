type NotificationHandler = (payload: any) => void;

type StreamKey = number;

const globalStreams = globalThis as typeof globalThis & {
  __notificationStreams?: Map<StreamKey, Set<NotificationHandler>>;
};

const streams =
  globalStreams.__notificationStreams ??
  new Map<StreamKey, Set<NotificationHandler>>();

if (!globalStreams.__notificationStreams) {
  globalStreams.__notificationStreams = streams;
}

export const subscribeNotificationStream = (
  usuarioId: number,
  handler: NotificationHandler,
) => {
  const existing = streams.get(usuarioId) ?? new Set<NotificationHandler>();
  existing.add(handler);
  streams.set(usuarioId, existing);

  return () => {
    const set = streams.get(usuarioId);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) streams.delete(usuarioId);
  };
};

export const publishNotificationStream = (
  usuarioId: number,
  payload: any,
) => {
  const set = streams.get(usuarioId);
  if (!set) return;
  set.forEach((handler) => handler(payload));
};

export const hasActiveNotificationStream = (usuarioId: number) => {
  return (streams.get(usuarioId)?.size || 0) > 0;
};
