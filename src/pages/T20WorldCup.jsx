import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw,
    Trophy,
    WifiOff,
    ChevronLeft,
    Clock,
    MapPin,
    Calendar,
    CheckCircle2,
    Loader2,
    Database,
    Zap,
    Radio,
    AlarmClock,
    Star,
    Activity,
    Shield,
    ArrowRight,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import cricketService from '../services/cricketService';

// ─── Flag CDN fallback map ────────────────────────────────────────────────
const ISO_FLAGS = {
    IND: 'in', PAK: 'pk', AUS: 'au', ENG: 'gb-eng',
    SA: 'za', WI: 'jm', NZ: 'nz', SL: 'lk',
    AFG: 'af', BAN: 'bd', ZIM: 'zw', SCO: 'gb-sct',
    IRE: 'ie', NED: 'nl', NAM: 'na', NEP: 'np',
    USA: 'us', CAN: 'ca', UGA: 'ug', OMA: 'om',
    UAE: 'ae', PNG: 'pg', HK: 'hk', BHR: 'bh',
};
function flagUrl(shortName) {
    const iso = ISO_FLAGS[shortName?.toUpperCase()];
    return iso ? `https://flagcdn.com/w40/${iso}.png` : null;
}

// ─── Date formatter ───────────────────────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch { return iso; }
}

// ─── Filter tabs (simplified) ─────────────────────────────────────────────
const TABS = [
    { id: 'all', label: 'All', Icon: Shield },
    { id: 'live', label: 'Live', Icon: Radio },
    { id: 'upcoming', label: 'Upcoming', Icon: AlarmClock },
    { id: 'completed', label: 'Completed', Icon: CheckCircle2 },
];

// ─── Live pulse dot ──────────────────────────────────────────────────────
const LivePulse = () => (
    <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.12em' }}
            className="text-[10px] font-black text-red-500 uppercase"
        >
            Live
        </span>
    </span>
);

// ─── Team logo: API img → flag CDN → initials ─────────────────────────────
const TeamLogo = ({ team }) => {
    const [imgErr, setImgErr] = useState(false);
    const initials = (team.shortName || team.name || '?').slice(0, 2).toUpperCase();

    if (team.img && !imgErr) {
        return (
            <img
                src={team.img}
                alt={team.name || team.shortName}
                className="w-8 h-8 rounded object-cover border border-gray-200 flex-shrink-0"
                onError={() => setImgErr(true)}
            />
        );
    }
    const flag = flagUrl(team.shortName);
    if (flag) {
        return (
            <img
                src={flag}
                alt={initials}
                className="w-8 h-8 object-cover rounded flex-shrink-0"
                onError={() => { }}
            />
        );
    }
    return (
        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-semibold text-gray-600">{initials}</span>
        </div>
    );
};

// ─── Single team row (simplified) ────────────────────────────────────────
const TeamRow = ({ team, inning, isBatting }) => (
    <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
            <TeamLogo team={team} />
            <span className="text-sm font-semibold text-gray-900 truncate">
                {team.shortName || team.name}
            </span>
            {isBatting && (
                <span className="text-[9px] font-medium text-amber-600">
                    BAT
                </span>
            )}
        </div>
        {inning ? (
            <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                    {inning.runs}/{inning.wickets}
                </span>
                <span className="text-[10px] text-gray-500 ml-1">
                    ({inning.overs} ov)
                </span>
            </div>
        ) : (
            <span className="text-[10px] text-gray-400">—</span>
        )}
    </div>
);

// ─── Match card ───────────────────────────────────────────────────────────
const MatchCard = ({ match }) => {
    const isLive = match.matchStarted && !match.matchEnded;
    const isUpcoming = !match.matchStarted;

    const team0 = match.teamInfo?.[0] || { name: match.teams?.[0] || '?', shortName: '', img: null };
    const team1 = match.teamInfo?.[1] || { name: match.teams?.[1] || '?', shortName: '', img: null };

    const innFor = (team, idx) =>
        match.innings?.find(i =>
            i.inning.toLowerCase().includes((team.name || '').toLowerCase()) ||
            i.inning.toLowerCase().includes((team.shortName || '').toLowerCase())
        ) || match.innings?.[idx] || null;

    const inn0 = innFor(team0, 0);
    const inn1 = innFor(team1, 1);

    const battingInning = isLive && match.innings?.length > 0
        ? match.innings[match.innings.length - 1]?.inning || ''
        : '';
    const isBatting0 = isLive && battingInning.toLowerCase().includes((team0.name || 'zzz').toLowerCase());
    const isBatting1 = isLive && battingInning.toLowerCase().includes((team1.name || 'zzz').toLowerCase());

    return (
        <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 m-2 pt-3 w-full max-w-full min-w-0 box-border">
            {/* Only show LIVE badge when live */}
            {isLive && (
                <div className="px-3 py-2 mb-2 flex items-center justify-between bg-red-50">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                        LIVE
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 uppercase flex-shrink-0">T20</span>
                </div>
            )}

            {/* Teams side by side - Flag 1 vs Flag 2 */}
            <div className="px-3 pb-3 min-w-0 overflow-hidden">
                <div className="flex items-stretch gap-1.5 sm:gap-2 min-w-0">
                    {/* Team 0 */}
                    <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <TeamLogo team={team0} />
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1 flex-wrap min-w-0">
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate block min-w-0">
                                    {team0.shortName || team0.name}
                                </span>
                                {isBatting0 && (
                                    <span className="text-[9px] font-medium text-amber-600 px-1 py-0.5 bg-amber-50 rounded flex-shrink-0">
                                        BAT
                                    </span>
                                )}
                            </div>
                            {inn0 ? (
                                <div className="text-[11px] sm:text-xs text-gray-600 mt-0.5 truncate">
                                    <span className="font-bold">{inn0.runs}/{inn0.wickets}</span>
                                    <span className="ml-0.5">({inn0.overs} ov)</span>
                                </div>
                            ) : (
                                <span className="text-[11px] text-gray-400">—</span>
                            )}
                        </div>
                    </div>

                    {/* VS separator */}
                    <div className="flex flex-col items-center justify-center flex-shrink-0 px-1">
                        <span className="text-[10px] font-semibold text-gray-400">VS</span>
                    </div>

                    {/* Team 1 */}
                    <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <TeamLogo team={team1} />
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1 flex-wrap min-w-0">
                                <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate block min-w-0">
                                    {team1.shortName || team1.name}
                                </span>
                                {isBatting1 && (
                                    <span className="text-[9px] font-medium text-amber-600 px-1 py-0.5 bg-amber-50 rounded flex-shrink-0">
                                        BAT
                                    </span>
                                )}
                            </div>
                            {inn1 ? (
                                <div className="text-[11px] sm:text-xs text-gray-600 mt-0.5 truncate">
                                    <span className="font-bold">{inn1.runs}/{inn1.wickets}</span>
                                    <span className="ml-0.5">({inn1.overs} ov)</span>
                                </div>
                            ) : (
                                <span className="text-[11px] text-gray-400">—</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Match details - wrap and contain for small screens */}
            <div className="px-3 pb-3 pt-2 min-w-0 overflow-hidden">
                <p className="text-[11px] sm:text-xs text-gray-700 mb-1.5 break-words line-clamp-2">
                    {match.status || '—'}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-500 min-w-0">
                    {match.venue && (
                        <span className="truncate max-w-full">{match.venue}</span>
                    )}
                    {match.date && (
                        <span className="flex-shrink-0">{fmtDate(match.date)}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-white rounded-lg overflow-hidden animate-pulse m-2 pt-3">
        <div className="px-3 pb-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-200" />
                    <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-20 mb-1" />
                        <div className="h-2.5 bg-gray-100 rounded w-16" />
                    </div>
                </div>
                <div className="w-6 h-3 bg-gray-100 rounded" />
                <div className="flex-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-200" />
                    <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-20 mb-1" />
                        <div className="h-2.5 bg-gray-100 rounded w-16" />
                    </div>
                </div>
            </div>
        </div>
        <div className="px-3 pb-3 pt-2">
            <div className="h-2.5 bg-gray-100 rounded w-full mb-1.5" />
            <div className="h-2 bg-gray-100 rounded w-2/3" />
        </div>
    </div>
);

// ─── Section header ───────────────────────────────────────────────────────
const SectionHeader = ({ icon, label, count }) => (
    <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100">
            {icon}
        </div>
        <h2
            className="text-[11px] font-black text-gray-500 uppercase tracking-[0.14em]"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {label}
        </h2>
        {count != null && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {count}
            </span>
        )}
        <div className="flex-1 h-px bg-gray-100" />
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────
const T20WorldCup = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isStaff = !!user && ['admin', 'moderator'].includes(user?.role);

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (!isStaff) return false;
        if (typeof window !== 'undefined') return window.innerWidth >= 1024;
        return false;
    });
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [fromCache, setFromCache] = useState(false);
    const [apiInfo, setApiInfo] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // ── fetch ────────────────────────────────────────────────────────────────
    const load = useCallback(async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        setError(null);
        try {
            const result = await cricketService.getT20WorldCupMatches();
            setMatches(Array.isArray(result.data) ? result.data : []);
            setFromCache(!!result.fromCache);
            if (result.hitsUsed != null) setApiInfo({ used: result.hitsUsed, limit: result.hitsLimit });
            setLastUpdated(new Date());
        } catch (e) {
            setError(e.message || 'Failed to load matches. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const forceRefresh = useCallback(async () => {
        setRefreshing(true);
        setError(null);
        try {
            const result = await cricketService.forceRefresh();
            setMatches(Array.isArray(result.data) ? result.data : []);
            setFromCache(false);
            if (result.hitsUsed != null) setApiInfo({ used: result.hitsUsed, limit: result.hitsLimit });
            setLastUpdated(new Date());
        } catch (e) {
            setError(e.message || 'Refresh failed.');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── derived ───────────────────────────────────────────────────────────────
    const liveMatches = matches.filter(m => m.matchStarted && !m.matchEnded);
    const upcomingMatches = matches.filter(m => !m.matchStarted);
    const completedMatches = matches.filter(m => m.matchEnded);

    const tabFiltered = (() => {
        if (activeTab === 'live') return liveMatches;
        if (activeTab === 'upcoming') return upcomingMatches;
        if (activeTab === 'completed') return completedMatches;
        return matches;
    })();

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            {isStaff && (
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} activeTab="" />
            )}

            <div className={`transition-all duration-300 w-full max-w-full overflow-x-hidden box-border ${isStaff && sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`} style={{ minWidth: 0 }}>
                <Header onSidebarToggle={() => setSidebarOpen(p => !p)} />

                {/* ══ Hero ══════════════════════════════════════════════════════════ */}
                <div className="bg-white">
                    <div className="px-4 sm:px-6 lg:px-10 py-4">
                        {/* Back */}
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium mb-4 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>

                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Trophy className="w-5 h-5 text-gray-700 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                                        ICC Men's T20 World Cup
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        Live scores & fixtures
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Filter tabs - scroll on small screens without expanding page */}
                        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto overflow-y-hidden min-h-0 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {TABS.map(({ id, label, Icon }) => {
                                const isActive = activeTab === id;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`
                                            flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                            ${isActive
                                                ? 'text-gray-900 border-gray-900'
                                                : 'text-gray-500 border-transparent hover:text-gray-700'}
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ══ Toolbar ═══════════════════════════════════════════════════════ */}
                <div className="sticky top-14 sm:top-16 z-20 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-10 py-2 sm:py-2.5 flex items-center justify-end">
                    <button
                        onClick={forceRefresh}
                        disabled={refreshing || loading}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-40 transition-colors"
                    >
                        {refreshing
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <RefreshCw className="w-4 h-4" />
                        }
                        <span>Refresh</span>
                    </button>
                </div>

                {/* ══ Content ════════════════════════════════════════════════════════ */}
                <main className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 w-full max-w-full overflow-x-hidden box-border" style={{ minWidth: 0 }}>

                    {/* Loading skeletons */}
                    {loading && (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                                <WifiOff className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-base font-black text-gray-800 mb-2"
                                style={{ fontFamily: "'Inter', sans-serif" }}>
                                Couldn't load scores
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-sm">{error}</p>
                            <button
                                onClick={() => load()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && tabFiltered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-5">
                                <Trophy className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-base font-black text-gray-800 mb-2"
                                style={{ fontFamily: "'Inter', sans-serif" }}>
                                No {activeTab === 'all' ? '' : activeTab} matches
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {activeTab === 'all'
                                    ? 'No T20 World Cup matches available. Check back soon.'
                                    : `No ${activeTab} matches right now.`}
                            </p>
                            {activeTab !== 'all' && (
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                    Show all matches
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Match cards - minmax(0,1fr) prevents overflow on Android */}
                    {!loading && !error && tabFiltered.length > 0 && (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
                            {tabFiltered.map(m => <MatchCard key={m.id} match={m} />)}
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
};

export default T20WorldCup;
