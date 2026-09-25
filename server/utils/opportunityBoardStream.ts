type BoardEventHandler = (payload: any) => void;

const globalBoardStreams = globalThis as typeof globalThis & {
  __opportunityBoardStreams?: Map<number, Set<BoardEventHandler>>;
};

const streams =
  globalBoardStreams.__opportunityBoardStreams ??
  new Map<number, Set<BoardEventHandler>>();

if (!globalBoardStreams.__opportunityBoardStreams) {
  globalBoardStreams.__opportunityBoardStreams = streams;
}

export const subscribeOpportunityBoardStream = (
  empresaId: number,
  handler: BoardEventHandler,
) => {
  const existing = streams.get(empresaId) ?? new Set<BoardEventHandler>();
  existing.add(handler);
  streams.set(empresaId, existing);

  return () => {
    const set = streams.get(empresaId);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) streams.delete(empresaId);
  };
};

export const publishOpportunityBoardStream = (
  empresaId: number,
  payload: any,
) => {
  const set = streams.get(empresaId);
  if (!set) return;
  set.forEach((handler) => handler(payload));
};
