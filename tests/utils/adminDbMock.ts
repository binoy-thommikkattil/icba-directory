import { vi } from 'vitest';

type DocumentState = Record<string, Record<string, any>>;

export function createAdminDbMock(initialState: DocumentState = {}) {
  const state: DocumentState = structuredClone(initialState);
  const calls = {
    add: new Map<string, ReturnType<typeof vi.fn>>(),
    set: new Map<string, ReturnType<typeof vi.fn>>(),
    update: new Map<string, ReturnType<typeof vi.fn>>(),
    delete: new Map<string, ReturnType<typeof vi.fn>>(),
    get: new Map<string, ReturnType<typeof vi.fn>>(),
  };

  const ensureCollection = (name: string) => {
    state[name] ||= {};
    return state[name];
  };

  const getCall = (kind: keyof typeof calls, key: string, implementation: (...args: any[]) => any) => {
    const map = calls[kind];
    if (!map.has(key)) map.set(key, vi.fn(implementation));
    return map.get(key)!;
  };

  const makeSnapshot = (id: string, data: any) => ({
    id,
    exists: Boolean(data),
    data: () => data,
  });

  const db = {
    collection: vi.fn((collectionName: string) => {
      const collectionState = ensureCollection(collectionName);
      return {
        add: getCall('add', collectionName, async (payload: any) => {
          const id = `${collectionName}-${Object.keys(collectionState).length + 1}`;
          collectionState[id] = structuredClone(payload);
          return { id };
        }),
        doc: vi.fn((docId: string) => ({
          set: getCall('set', `${collectionName}/${docId}`, async (payload: any, options?: { merge?: boolean }) => {
            collectionState[docId] = options?.merge ? { ...(collectionState[docId] || {}), ...payload } : structuredClone(payload);
          }),
          update: getCall('update', `${collectionName}/${docId}`, async (payload: any) => {
            collectionState[docId] = { ...(collectionState[docId] || {}), ...structuredClone(payload) };
          }),
          delete: getCall('delete', `${collectionName}/${docId}`, async () => {
            delete collectionState[docId];
          }),
          get: getCall('get', `${collectionName}/${docId}`, async () => makeSnapshot(docId, collectionState[docId])),
        })),
        orderBy: vi.fn((field: string, direction: 'asc' | 'desc' = 'asc') => ({
          limit: vi.fn((count: number) => ({
            get: getCall('get', `${collectionName}:orderBy:${field}:${direction}:limit:${count}`, async () => {
              const docs = Object.entries(collectionState)
                .map(([id, data]) => makeSnapshot(id, data))
                .sort((left, right) => {
                  const leftValue = left.data()?.[field] ?? 0;
                  const rightValue = right.data()?.[field] ?? 0;
                  return direction === 'desc' ? rightValue - leftValue : leftValue - rightValue;
                })
                .slice(0, count);
              return { docs, empty: docs.length === 0 };
            }),
          })),
        })),
      };
    }),
  };

  return { db, state, calls };
}
