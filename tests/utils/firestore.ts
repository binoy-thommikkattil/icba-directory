export function createFirestoreSnapshot<T extends { id?: string }>(records: T[]) {
  return {
    docs: records.map((record, index) => {
      const { id = `doc-${index + 1}`, ...data } = record;
      return {
        id,
        data: () => data,
        exists: () => true,
      };
    }),
    empty: records.length === 0,
  };
}

export function createDocSnapshot<T extends { id?: string }>(record: T | null) {
  if (!record) {
    return {
      id: '',
      exists: () => false,
      data: () => undefined,
    };
  }

  const { id = 'doc-1', ...data } = record;
  return {
    id,
    exists: () => true,
    data: () => data,
  };
}

export function getCollectionName(queryRef: unknown) {
  if (typeof queryRef === 'string') return queryRef;
  if (queryRef && typeof queryRef === 'object' && 'collectionName' in queryRef) {
    return String((queryRef as { collectionName: string }).collectionName);
  }
  return 'unknown';
}
