import "server-only";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Firestore menolak nilai `undefined`. Helper ini membuang property undefined
 * secara rekursif tanpa mengubah Date, Timestamp, FieldValue, DocumentReference,
 * dan object khusus Firebase lainnya.
 */
export function cleanFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const output: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    output[key] = cleanFirestoreData(item);
  }

  return output as T;
}
