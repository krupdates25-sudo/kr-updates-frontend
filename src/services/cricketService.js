/**
 * cricketService.js
 *
 * Calls CricketData (CricAPI) directly from the frontend.
 * Docs: https://www.cricapi.com/how-to-use/
 *
 * Free plan  : 100 requests / day
 * Cache layer: memory (per page lifecycle) + localStorage (survives reload)
 *   • Live match TTL  : 60 s
 *   • No-live TTL     : 5 min
 */

const API_KEY = 'f0626644-690e-4d01-9a7a-7eeea65aa4e6';
const BASE_URL = 'https://api.cricapi.com/v1';
const LS_KEY = 'cricapi_t20_matches_v1';
const MEM = new Map();           // key → { data, expiresAt }
const TTL_LIVE = 60_000;             // 60 s  while any match is live
const TTL_IDLE = 5 * 60_000;         // 5 min when no live match

// ─── Cache helpers ────────────────────────────────────────────────────────

function memGet(key) {
    const e = MEM.get(key);
    if (!e || Date.now() > e.expiresAt) { MEM.delete(key); return null; }
    return e.data;
}
function memSet(key, data, ttl) {
    MEM.set(key, { data, expiresAt: Date.now() + ttl });
}

function lsGet(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { data, expiresAt } = JSON.parse(raw);
        if (Date.now() > expiresAt) { localStorage.removeItem(key); return null; }
        return data;
    } catch { return null; }
}
function lsSet(key, data, ttl) {
    try {
        localStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + ttl }));
    } catch { /* quota exceeded – ignore */ }
}

function readCache(key) { return memGet(key) ?? lsGet(key); }
function writeCache(key, d, ttl) { memSet(key, d, ttl); lsSet(key, d, ttl); }
function clearCache() { MEM.delete(LS_KEY); try { localStorage.removeItem(LS_KEY); } catch { } }

// ─── Normalizer (CricAPI → clean shape) ──────────────────────────────────
// Raw CricAPI fields:
//   teamInfo[].shortname  (lowercase)
//   teamInfo[].img        (logo URL from CricAPI CDN)
//   score[].r / .w / .o / .inning

function normalizeMatch(m) {
    const rawTeams = Array.isArray(m.teamInfo) ? m.teamInfo : [];
    const rawScores = Array.isArray(m.score) ? m.score : [];

    const teamInfo = rawTeams.map((t) => ({
        name: t.name || '',
        shortName: t.shortname || t.shortName || '',
        img: t.img || null,   // official logo from CricAPI
    }));

    const innings = rawScores.map((s) => ({
        inning: s.inning || '',
        runs: Number(s.r ?? 0),
        wickets: Number(s.w ?? 0),
        overs: Number(s.o ?? 0),
        scoreStr: s.r != null
            ? `${s.r}/${s.w ?? '?'}${s.o != null ? ` (${s.o} ov)` : ''}`
            : '',
    }));

    return {
        id: m.id || String(Math.random()),
        name: m.name || '',
        series: m.series || '',
        seriesId: m.series_id || '',
        venue: m.venue || '',
        date: m.dateTimeGMT || m.date || null,
        status: m.status || '',
        matchType: (m.matchType || '').toLowerCase(),
        matchStarted: !!m.matchStarted,
        matchEnded: !!m.matchEnded,
        teams: Array.isArray(m.teams) ? m.teams : [],
        teamInfo,
        innings,
    };
}

// ─── T20 World Cup filter ─────────────────────────────────────────────────

function isT20WC(m) {
    const text = `${m.name} ${m.series || ''}`.toLowerCase();
    return (
        text.includes('world cup') ||
        text.includes('icc men') ||
        text.includes('icc t20') ||
        text.includes('t20wc')
    );
}

// ─── Public service ───────────────────────────────────────────────────────

const cricketService = {
    /**
     * Fetch current T20 World Cup matches.
     * Reads from cache when still valid; calls CricAPI otherwise.
     *
     * Returns:
     *   { data: Match[], fromCache: boolean, hitsUsed?: number, hitsLimit?: number }
     */
    getT20WorldCupMatches: async () => {
        // 1. Cache hit?
        const cached = readCache(LS_KEY);
        if (cached) return { data: cached, fromCache: true };

        // 2. Fetch from CricAPI
        const res = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`);
        if (!res.ok) throw new Error(`CricAPI responded ${res.status} ${res.statusText}`);

        const json = await res.json();
        if (json.status !== 'success') {
            throw new Error(json.reason || json.status || 'CricAPI returned a non-success status');
        }

        const all = Array.isArray(json.data) ? json.data : [];

        // 3. Filter – prefer WC matches; fall back to all T20s; then everything
        let filtered = all.filter(isT20WC);
        if (!filtered.length) filtered = all.filter((m) => m.matchType?.toLowerCase() === 't20');
        if (!filtered.length) filtered = all;

        // 4. Normalize + cache
        const data = filtered.map(normalizeMatch);
        const hasLive = data.some((m) => m.matchStarted && !m.matchEnded);
        writeCache(LS_KEY, data, hasLive ? TTL_LIVE : TTL_IDLE);

        return {
            data,
            fromCache: false,
            hitsUsed: json.info?.hitsUsed ?? null,
            hitsLimit: json.info?.hitsLimit ?? null,
            hitsToday: json.info?.hitsToday ?? null,
        };
    },

    /** Bypass cache and force a fresh API call */
    forceRefresh: async () => {
        clearCache();
        return cricketService.getT20WorldCupMatches();
    },
};

export default cricketService;
