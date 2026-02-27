// bhaskarService.js
// Helper for Dainik Bhaskar public endpoints:
// - Hindi match schedule cards
// - State news list (locations)
//
// NOTE: These endpoints are used read-only from the frontend. Some of the
// headers from the original curl (origin, referer, user-agent, etc.) cannot
// be set by browsers and are intentionally omitted here.

import { API_BASE_URL } from '../config/api';

const BHASKAR_SCHEDULE_URL = `${API_BASE_URL}/bhaskar/schedule`;
const BHASKAR_STATE_NEWS_URL = `${API_BASE_URL}/bhaskar/states`;

// Small in-memory cache to avoid hitting these APIs too often
const MEMORY = new Map(); // key -> { data, expiresAt }

function memGet(key) {
  const entry = MEMORY.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    MEMORY.delete(key);
    return null;
  }
  return entry.data;
}

function memSet(key, data, ttlMs) {
  MEMORY.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const BHASKAR_SCHEDULE_KEY = 'bhaskar_schedule_v1';
const BHASKAR_STATE_KEY = 'bhaskar_states_v1';
const TTL_SHORT = 5 * 60 * 1000; // 5 min
const TTL_LONG = 60 * 60 * 1000; // 1 hr

export async function getHindiSchedule() {
  const cached = memGet(BHASKAR_SCHEDULE_KEY);
  if (cached) return cached;

  const res = await fetch(BHASKAR_SCHEDULE_URL, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Bhaskar schedule responded ${res.status}`);
  }

  const json = await res.json();
  const upcoming = Array.isArray(json.upcomingMatches) ? json.upcomingMatches : [];
  const completed = Array.isArray(json.completedMatched) ? json.completedMatched : [];

  const normalizeMatch = (m) => ({
    id: m.match_Id || m.match_Id_eng || `${m.matchfile || ''}`,
    isLive: m.live === '1',
    matchNumber: m.matchnumber || '',
    status: m.matchstatus || '',
    result: m.matchresult || '',
    dateIST: m.matchdate_ist || '',
    timeIST: m.matchtime_ist || '',
    venue: m.venue || '',
    series: m.series_short_display_name_eng || '',
    deeplink: m.deeplink || '',
  });

  const data = {
    upcoming: upcoming.map(normalizeMatch),
    completed: completed.map(normalizeMatch),
  };

  memSet(BHASKAR_SCHEDULE_KEY, data, TTL_SHORT);
  return data;
}

export async function getStateNewsLocations() {
  const cached = memGet(BHASKAR_STATE_KEY);
  if (cached) return cached;

  const res = await fetch(BHASKAR_STATE_NEWS_URL, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Bhaskar state-news responded ${res.status}`);
  }

  const json = await res.json();
  const list = Array.isArray(json.list) ? json.list : [];

  const locations = list.map((item) => ({
    id: item.id,
    nameHi: item.location,
    listingUrl: item.listingUrl,
  }));

  const uniqueNames = Array.from(new Set(locations.map((l) => l.nameHi).filter(Boolean)));

  const result = {
    locations,
    names: uniqueNames,
  };

  memSet(BHASKAR_STATE_KEY, result, TTL_LONG);
  return result;
}


