// ─────────────────────────────────────────────────────────────
//  offlineCache.ts
//  Simple localStorage cache for clinic data.
//  Call save() after every successful API fetch.
//  Call load() as the fallback when offline.
// ─────────────────────────────────────────────────────────────

const PREFIX = "emr_cache_";
const TIMESTAMP_PREFIX = "emr_cache_ts_";

// Keys for each data type
export const CACHE_KEYS = {
  patients:      "patients",
  appointments:  "appointments",
  prescriptions: "prescriptions",
  billing:       "billing",
  uploads:       "uploads",
} as const;

type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];

// ── Save data to cache ──────────────────────────────────────
export function saveCache(key: CacheKey, data: any) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
    localStorage.setItem(TIMESTAMP_PREFIX + key, Date.now().toString());
  } catch (e) {
    console.warn("Cache save failed:", e);
  }
}

// ── Load data from cache ────────────────────────────────────
export function loadCache<T = any>(key: CacheKey): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn("Cache load failed:", e);
    return null;
  }
}

// ── Get cache timestamp ─────────────────────────────────────
export function getCacheTime(key: CacheKey): string | null {
  try {
    const ts = localStorage.getItem(TIMESTAMP_PREFIX + key);
    if (!ts) return null;
    const date = new Date(parseInt(ts));
    return date.toLocaleString("en-IN", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return null; }
}

// ── Clear all cache ─────────────────────────────────────────
export function clearAllCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(PREFIX + key);
    localStorage.removeItem(TIMESTAMP_PREFIX + key);
  });
}

// ── Fetch with cache fallback ───────────────────────────────
// Use this instead of plain fetch() in your pages.
// Online  → fetches fresh data, saves to cache, returns it
// Offline → returns cached data + sets fromCache=true
export async function fetchWithCache<T = any>(
  url: string,
  cacheKey: CacheKey,
  options?: RequestInit
): Promise<{ data: T | null; fromCache: boolean; cacheTime: string | null }> {
  // If offline, return cache immediately
  if (!navigator.onLine) {
    const cached = loadCache<T>(cacheKey);
    return { data: cached, fromCache: true, cacheTime: getCacheTime(cacheKey) };
  }

  try {
    const res = await fetch(url, { cache: "no-store", ...options });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Save fresh data to cache
    saveCache(cacheKey, data);
    return { data, fromCache: false, cacheTime: null };
  } catch (err) {
    // Network error even though navigator.onLine — fall back to cache
    console.warn(`Fetch failed for ${url}, using cache:`, err);
    const cached = loadCache<T>(cacheKey);
    return { data: cached, fromCache: true, cacheTime: getCacheTime(cacheKey) };
  }
}