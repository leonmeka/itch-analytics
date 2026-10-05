export function diffImportRow<T extends object>(
  current: object,
  payload: T,
  fields: readonly (keyof T)[],
): Partial<T> | null {
  const changes: Partial<T> = {};
  for (const field of fields) {
    const before = (current as T)[field];
    const after = payload[field];
    const unchanged =
      before instanceof Date && after instanceof Date
        ? before.getTime() === after.getTime()
        : JSON.stringify(before ?? null) === JSON.stringify(after ?? null);
    if (!unchanged) changes[field] = after;
  }
  return Object.keys(changes).length > 0 ? changes : null;
}
