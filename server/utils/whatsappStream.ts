type StreamHandler = (payload: any) => void;

type StreamKey = string;

const getKey = (empresaId: number, numero: string) =>
  `${empresaId}:${numero}`;

const globalStreams = globalThis as typeof globalThis & {
  __whatsappStreams?: Map<StreamKey, Set<StreamHandler>>;
};

const streams =
  globalStreams.__whatsappStreams ?? new Map<StreamKey, Set<StreamHandler>>();

if (!globalStreams.__whatsappStreams) {
  globalStreams.__whatsappStreams = streams;
}

export const subscribeWhatsappStream = (
  empresaId: number,
  numero: string,
  handler: StreamHandler,
) => {
  const key = getKey(empresaId, numero);
  const existing = streams.get(key) ?? new Set<StreamHandler>();
  existing.add(handler);
  streams.set(key, existing);

  return () => {
    const set = streams.get(key);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) streams.delete(key);
  };
};

export const publishWhatsappStream = (
  empresaId: number,
  numero: string,
  payload: any,
) => {
  const key = getKey(empresaId, numero);
  const set = streams.get(key);
  if (!set) return;
  set.forEach((handler) => handler(payload));
};
