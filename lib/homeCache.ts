let _cachedStats: unknown = null;
let _cachedWild: unknown[] = [];

export function getCachedStats() { return _cachedStats; }
export function getCachedWild() { return _cachedWild; }
export function setCachedStats(v: unknown) { _cachedStats = v; }
export function setCachedWild(v: unknown[]) { _cachedWild = v; }

export function resetHomeCache() {
  _cachedStats = null;
  _cachedWild = [];
}
