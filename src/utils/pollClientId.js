const STORAGE_KEY = 'kr_poll_client_id';

/** Anonymous poll voting id (persisted). Backend pairs votes with logged-in users via JWT. */
export function getOrCreatePollClientId() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 10) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `p_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `p_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;
  }
}
