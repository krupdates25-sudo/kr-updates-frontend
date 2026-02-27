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

// ─── Filter tabs (no emoji) ────────────────────────────────────────────────
const TABS = [
    { id: 'all', label: 'All', Icon: Shield },
    { id: 'live', label: 'Live', Icon: Radio },
    { id: 'upcoming', label: 'Upcoming', Icon: AlarmClock },
    { id: 'completed', label: 'Results', Icon: CheckCircle2 },
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
    const initials = (team.shortName || team.name || '?').slice(0, 3).toUpperCase();

    if (team.img && !imgErr) {
        return (
            <img
                src={team.img}
                alt={initials}
                className="w-9 h-9 rounded-full object-cover bg-white shadow-sm ring-2 ring-white/30 flex-shrink-0"
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
                className="w-9 h-[26px] object-cover rounded-[4px] shadow flex-shrink-0"
                onError={() => { }}
            />
        );
    }
    return (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow">
            <span className="text-[10px] font-black text-white tracking-wide">{initials}</span>
        </div>
    );
};

// ─── Single team row ──────────────────────────────────────────────────────
const TeamRow = ({ team, inning, isWinner, isBatting }) => (
    <div className={`
        flex items-center justify-between gap-3 px-4 py-3 relative
        transition-colors duration-200
        ${isWinner
            ? 'bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-900/20 dark:to-transparent'
            : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}
    `}>
        {/* Winner accent bar */}
        {isWinner && (
            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-500" />
        )}

        {/* Left: logo + name */}
        <div className="flex items-center gap-3 min-w-0">
            <TeamLogo team={team} />
            <div className="min-w-0">
                <p className={`
                    text-[13px] font-bold leading-tight truncate
                    ${isWinner
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-900 dark:text-gray-100'}
                `}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                >
                    {team.shortName || team.name}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate hidden sm:block">
                    {team.name}
                </p>
            </div>
            {isBatting && (
                <span
                    className="flex-shrink-0 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    title="Currently batting"
                >
                    <Activity className="w-2.5 h-2.5" />
                    BAT
                </span>
            )}
        </div>

        {/* Right: score */}
        <div className="flex-shrink-0 text-right">
            {inning ? (
                <>
                    <p
                        className={`font-black tabular-nums leading-tight ${isWinner
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-gray-900 dark:text-white'
                            }`}
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px' }}
                    >
                        {inning.runs}
                        <span className="text-gray-400 dark:text-gray-500 font-semibold" style={{ fontSize: '14px' }}>
                            /{inning.wickets}
                        </span>
                    </p>
                    <p className="text-[11px] text-gray-400 tabular-nums text-right">
                        {inning.overs} ov
                    </p>
                </>
            ) : (
                <p className="text-[11px] text-gray-400 italic">Yet to bat</p>
            )}
        </div>
    </div>
);

// ─── Match card ───────────────────────────────────────────────────────────
const MatchCard = ({ match }) => {
    const isLive = match.matchStarted && !match.matchEnded;
    const isUpcoming = !match.matchStarted;
    const isComplete = match.matchEnded;

    const winnerName = isComplete && match.status?.toLowerCase().includes(' won')
        ? match.status.split(' won')[0].trim()
        : null;

    const team0 = match.teamInfo?.[0] || { name: match.teams?.[0] || '?', shortName: '', img: null };
    const team1 = match.teamInfo?.[1] || { name: match.teams?.[1] || '?', shortName: '', img: null };

    const innFor = (team, idx) =>
        match.innings?.find(i =>
            i.inning.toLowerCase().includes((team.name || '').toLowerCase()) ||
            i.inning.toLowerCase().includes((team.shortName || '').toLowerCase())
        ) || match.innings?.[idx] || null;

    const inn0 = innFor(team0, 0);
    const inn1 = innFor(team1, 1);

    const wins0 = !!(winnerName && (
        winnerName.toLowerCase().includes(team0.name?.toLowerCase() || '___') ||
        winnerName.toLowerCase().includes(team0.shortName?.toLowerCase() || '___')
    ));
    const wins1 = !!(winnerName && (
        winnerName.toLowerCase().includes(team1.name?.toLowerCase() || '___') ||
        winnerName.toLowerCase().includes(team1.shortName?.toLowerCase() || '___')
    ));

    const battingInning = isLive && match.innings?.length > 0
        ? match.innings[match.innings.length - 1]?.inning || ''
        : '';
    const isBatting0 = isLive && battingInning.toLowerCase().includes((team0.name || 'zzz').toLowerCase());
    const isBatting1 = isLive && battingInning.toLowerCase().includes((team1.name || 'zzz').toLowerCase());

    return (
        <div className={`
            group relative bg-white dark:bg-gray-800/90 rounded-2xl border
            transition-all duration-300 overflow-hidden cursor-default
            hover:shadow-xl hover:-translate-y-0.5
            ${isLive
                ? 'border-red-200 dark:border-red-800/60 shadow-md shadow-red-100 dark:shadow-red-900/20'
                : 'border-gray-100 dark:border-gray-700/60 shadow-sm hover:border-gray-200 dark:hover:border-gray-600'}
        `}>
            {/* Live glow strip */}
            {isLive && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />
            )}

            {/* Card header bar */}
            <div className={`px-4 py-2.5 flex items-center justify-between ${isLive
                ? 'bg-gradient-to-r from-red-50 to-orange-50/30 dark:from-red-950/50 dark:to-transparent'
                : isUpcoming
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/30 dark:from-blue-950/40 dark:to-transparent'
                    : 'bg-gray-50/60 dark:bg-gray-900/40'
                }`}>
                <div className="flex items-center gap-2">
                    {isLive && <LivePulse />}
                    {isUpcoming && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider"
                            style={{ fontFamily: "'Inter', sans-serif" }}>
                            <AlarmClock className="w-3 h-3" />
                            Upcoming
                        </span>
                    )}
                    {isComplete && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            style={{ fontFamily: "'Inter', sans-serif" }}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Result
                        </span>
                    )}
                </div>

                {/* T20 badge */}
                <span className={`
                    text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider
                    ${isLive
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                        : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}
                `}
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    T20
                </span>
            </div>

            {/* Match title */}
            <div className="px-4 pt-3 pb-1">
                <h3
                    className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 leading-snug line-clamp-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                >
                    {match.name}
                </h3>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gray-100 dark:bg-gray-700/50" />

            {/* Team scores */}
            <div>
                <TeamRow team={team0} inning={inn0} isWinner={wins0} isBatting={isBatting0} />
                <div className="mx-4 h-px bg-dashed bg-gray-100 dark:bg-gray-700/40 border-t border-dashed border-gray-100 dark:border-gray-700/40" />
                <TeamRow team={team1} inning={inn1} isWinner={wins1} isBatting={isBatting1} />
            </div>

            {/* Status footer */}
            <div className={`mx-3 mb-3 mt-2 rounded-xl px-3 py-2.5 ${isLive
                ? 'bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40'
                : (wins0 || wins1)
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40'
                    : isUpcoming
                        ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40'
                        : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/40'
                }`}>
                {/* Winner badge */}
                {(wins0 || wins1) && winnerName && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span
                            className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                            Won
                        </span>
                    </div>
                )}

                <p className={`text-[12px] font-semibold leading-snug ${isLive
                    ? 'text-red-600 dark:text-red-400'
                    : (wins0 || wins1)
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isUpcoming
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400'
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                >
                    {match.status || '—'}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                    {match.venue && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{match.venue}</span>
                        </span>
                    )}
                    {match.date && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                            <Calendar className="w-2.5 h-2.5" />
                            {fmtDate(match.date)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
        <div className="h-9 bg-gray-100 dark:bg-gray-700/60" />
        <div className="p-4 space-y-3">
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-4/5" />
            <div className="h-px bg-gray-100 dark:bg-gray-700" />
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600" />
                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="w-16 h-5 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-700" />
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600" />
                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="w-16 h-5 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            </div>
        </div>
        <div className="mx-3 mb-3 h-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700" />
    </div>
);

// ─── Section header ───────────────────────────────────────────────────────
const SectionHeader = ({ icon, label, count }) => (
    <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800">
            {icon}
        </div>
        <h2
            className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.14em]"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {label}
        </h2>
        {count != null && (
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {count}
            </span>
        )}
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
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

    // Auto-refresh every 60 s only when live matches present
    useEffect(() => {
        const hasLive = matches.some(m => m.matchStarted && !m.matchEnded);
        if (!hasLive) return;
        const t = setInterval(() => load(true), 60_000);
        return () => clearInterval(t);
    }, [matches, load]);

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
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#0a0c14] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            {isStaff && (
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} activeTab="" />
            )}

            <div className={`transition-all duration-300 w-full max-w-full overflow-x-hidden ${isStaff && sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
                <Header onSidebarToggle={() => setSidebarOpen(p => !p)} />

                {/* ══ Hero ══════════════════════════════════════════════════════════ */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0d1117] via-[#161b2e] to-[#1e2a4a]">
                    {/* Decorative glows */}
                    <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
                    <div className="absolute top-10 left-1/3 w-64 h-64 rounded-full bg-purple-600/8 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />

                    {/* Subtle grid overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

                    <div className="relative px-4 sm:px-6 lg:px-10 pt-5 pb-4">
                        {/* Back */}
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/90 text-xs font-semibold mb-5 transition-colors group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back
                        </button>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                                {/* Trophy icon — no emoji */}
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1
                                        className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight tracking-tight break-words"
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                    >
                                        ICC Men's T20 World Cup
                                    </h1>
                                    <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 font-medium">
                                        Live scores · Match results · Fixtures
                                    </p>
                                </div>
                            </div>

                            {liveMatches.length > 0 && (
                                <div className="flex-shrink-0 flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                    </span>
                                    {liveMatches.length} Live
                                </div>
                            )}
                        </div>

                        {/* Stats pills */}
                        {!loading && (
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-5 flex-wrap">
                                {[
                                    { label: `${matches.length} Matches`, cls: 'bg-white/8 text-white/70 border-white/10' },
                                    { label: `${liveMatches.length} Live`, cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
                                    { label: `${upcomingMatches.length} Upcoming`, cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
                                    { label: `${completedMatches.length} Completed`, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
                                ].map(({ label, cls }) => (
                                    <span
                                        key={label}
                                        className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border whitespace-nowrap ${cls}`}
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1.5 px-4 sm:px-6 lg:px-10 pb-5 mt-4 overflow-x-auto scrollbar-none">
                        {TABS.map(({ id, label, Icon }) => {
                            const isActive = activeTab === id;
                            const liveCount = id === 'live' && liveMatches.length > 0 ? liveMatches.length : 0;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`
                                        flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold
                                        transition-all duration-200 border
                                        ${isActive
                                            ? 'bg-white text-gray-900 border-transparent shadow-lg shadow-black/10'
                                            : 'bg-white/8 text-white/60 border-white/10 hover:bg-white/15 hover:text-white/80'}
                                    `}
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                    <Icon className={`w-3 h-3 ${isActive ? 'text-gray-700' : ''}`} />
                                    {label}
                                    {liveCount > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                            {liveCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ══ Toolbar ═══════════════════════════════════════════════════════ */}
                <div className="sticky top-14 sm:top-16 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-10 py-2 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {lastUpdated && (
                            <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-gray-400 font-medium">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span className="whitespace-nowrap">{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                            </span>
                        )}
                        {fromCache ? (
                            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                                <Database className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                                Cached
                            </span>
                        ) : lastUpdated ? (
                            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                                <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                                Live API
                            </span>
                        ) : null}
                    </div>

                    <button
                        onClick={forceRefresh}
                        disabled={refreshing || loading}
                        className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-40 transition-colors flex-shrink-0 self-start sm:self-auto"
                    >
                        {refreshing
                            ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                            : <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        }
                        <span className="whitespace-nowrap">Refresh</span>
                    </button>
                </div>

                {/* ══ Content ════════════════════════════════════════════════════════ */}
                <main className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-full overflow-x-hidden">

                    {/* Loading skeletons */}
                    {loading && (
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
                                <WifiOff className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-base font-black text-gray-800 dark:text-gray-200 mb-2"
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
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center mb-5">
                                <Trophy className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-base font-black text-gray-800 dark:text-gray-200 mb-2"
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
                                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                                >
                                    Show all matches
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Match cards */}
                    {!loading && !error && tabFiltered.length > 0 && (
                        <div className="space-y-6 sm:space-y-8">
                            {activeTab === 'all' ? (
                                <>
                                    {liveMatches.length > 0 && (
                                        <section>
                                            <SectionHeader
                                                icon={<Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />}
                                                label="Live Now"
                                                count={liveMatches.length}
                                            />
                                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                                {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
                                            </div>
                                        </section>
                                    )}
                                    {upcomingMatches.length > 0 && (
                                        <section>
                                            <SectionHeader
                                                icon={<AlarmClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />}
                                                label="Upcoming"
                                                count={upcomingMatches.length}
                                            />
                                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                                {upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}
                                            </div>
                                        </section>
                                    )}
                                    {completedMatches.length > 0 && (
                                        <section>
                                            <SectionHeader
                                                icon={<CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />}
                                                label="Results"
                                                count={completedMatches.length}
                                            />
                                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                                {completedMatches.map(m => <MatchCard key={m.id} match={m} />)}
                                            </div>
                                        </section>
                                    )}
                                </>
                            ) : (
                                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {tabFiltered.map(m => <MatchCard key={m.id} match={m} />)}
                                </div>
                            )}
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
};

export default T20WorldCup;
