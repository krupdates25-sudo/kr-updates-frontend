import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import postService from '../services/postService';
import { getStateNewsLocations } from '../services/bhaskarService';

const LanguageLocationContext = createContext({});

export const LanguageLocationProvider = ({ children }) => {
    const [location, setLocation] = useState(() => {
        return localStorage.getItem('kr_user_location') || 'Kishangarh Renwal';
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
        localStorage.setItem('kr_user_language', language);
    }, [language]);

    useEffect(() => {
        refreshLocations();
    }, [refreshLocations]);

    // If current location isn't present anymore, fall back to All
    useEffect(() => {
        if (!availableLocations || availableLocations.length === 0) return;
        if (!availableLocations.includes(location)) {
            setLocation('All');
        }
    }, [availableLocations, location]);

    const value = useMemo(() => ({
        location,
        setLocation,
        language,
        setLanguage,
        availableLocations,
        locationsLoading,
        refreshLocations,
    }), [location, language, availableLocations, locationsLoading, refreshLocations]);

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
