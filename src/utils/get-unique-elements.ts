export function getUniqueElements<T = unknown>(arr: T[]) {
  return [...new Set(arr)];
}
