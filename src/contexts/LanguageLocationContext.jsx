import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import postService from '../services/postService';
import { getStateNewsLocations } from '../services/bhaskarService';

const LanguageLocationContext = createContext({});

export const LanguageLocationProvider = ({ children }) => {
    const [location, setLocationValue] = useState(() => {
        return localStorage.getItem('kr_user_location') || 'Kishangarh Renwal';
    });

    // Multi-location selection (used for filtering feed). Empty array = All.
    const [selectedLocations, setSelectedLocations] = useState(() => {
        try {
            const raw = localStorage.getItem('kr_user_locations_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed.filter(Boolean);
            }
        } catch {
            // ignore
        }
        const single = localStorage.getItem('kr_user_location') || '';
        if (single && single !== 'All') return [single];
        return [];
    });

    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('kr_user_language') || 'hi'; // Default to Hindi as per request
    });

    const [availableLocations, setAvailableLocations] = useState(['All', 'Kishangarh Renwal']);
    const [locationsLoading, setLocationsLoading] = useState(false);

    const refreshLocations = useCallback(async () => {
        setLocationsLoading(true);
        try {
            // Merge locations from:
            // - Bhaskar state-news API (Hindi states)
            // - Our posts API (distinct locations from saved posts)
            const [bhaskar, res] = await Promise.allSettled([
                getStateNewsLocations(),
                postService.getLocationOptions(),
            ]);

            const namesFromBhaskar =
                bhaskar.status === 'fulfilled' && Array.isArray(bhaskar.value?.names)
                    ? bhaskar.value.names
                    : [];

            const locsFromPosts = (() => {
                if (res.status !== 'fulfilled') return [];
                const locs = res.value?.data?.locations || res.value?.locations || [];
                return Array.isArray(locs) ? locs : [];
            })();

            const normalizedPosts = locsFromPosts
                .map((l) => String(l || '').trim())
                .filter(Boolean);

            const finalList = Array.from(
                new Set([...namesFromBhaskar, ...normalizedPosts])
            );

            const withAll = ['All', ...finalList];
            setAvailableLocations(withAll.length > 1 ? withAll : ['All', 'Kishangarh Renwal']);
        } catch (e) {
            // Keep existing list on error
        } finally {
            setLocationsLoading(false);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('kr_user_location', location);
    }, [location]);

    useEffect(() => {
        try {
            localStorage.setItem('kr_user_locations_v1', JSON.stringify(selectedLocations || []));
        } catch {
            // ignore
        }
    }, [selectedLocations]);

    useEffect(() => {
        localStorage.setItem('kr_user_language', language);
    }, [language]);

    useEffect(() => {
        refreshLocations();
    }, [refreshLocations]);

    // If current location isn't present anymore, fall back to All
    useEffect(() => {
        if (!availableLocations || availableLocations.length === 0) return;
        if (!availableLocations.includes(location)) {
            setLocationValue('All');
        }
    }, [availableLocations, location]);

    // Keep single `location` in sync (for older parts of the UI)
    useEffect(() => {
        if (!Array.isArray(selectedLocations) || selectedLocations.length === 0) {
            if (location !== 'All') setLocationValue('All');
            return;
        }
        const first = String(selectedLocations[0] || '').trim();
        if (first && first !== location) setLocationValue(first);
    }, [selectedLocations, location]);

    // Single-select setter used by existing UI (header strip, etc.)
    const setLocation = useCallback((loc) => {
        const next = String(loc || '').trim() || 'All';
        setLocationValue(next);
        setSelectedLocations(next && next !== 'All' ? [next] : []);
    }, []);

    const toggleSelectedLocation = useCallback((loc) => {
        const name = String(loc || '').trim();
        if (!name || name === 'All') {
            setLocation('All');
            return;
        }
        setSelectedLocations((prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            const exists = arr.includes(name);
            const next = exists ? arr.filter((x) => x !== name) : [...arr, name];
            return next;
        });
    }, [setLocation]);

    const clearSelectedLocations = useCallback(() => {
        setSelectedLocations([]);
        setLocationValue('All');
    }, []);

    const value = useMemo(() => ({
        location,
        setLocation,
        selectedLocations,
        setSelectedLocations,
        toggleSelectedLocation,
        clearSelectedLocations,
        language,
        setLanguage,
        availableLocations,
        locationsLoading,
        refreshLocations,
    }), [location, setLocation, selectedLocations, setSelectedLocations, toggleSelectedLocation, clearSelectedLocations, language, availableLocations, locationsLoading, refreshLocations, setLanguage]);

    return (
        <LanguageLocationContext.Provider value={value}>
            {children}
        </LanguageLocationContext.Provider>
    );
};

export const useLanguageLocation = () => {
    const context = useContext(LanguageLocationContext);
    if (!context) {
        throw new Error('useLanguageLocation must be used within a LanguageLocationProvider');
    }
    return context;
};
