import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const LanguageLocationContext = createContext({});

export const LanguageLocationProvider = ({ children }) => {
    const [location, setLocation] = useState(() => {
        return localStorage.getItem('kr_user_location') || 'Kishangarh Renwal';
    });

    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('kr_user_language') || 'hi'; // Default to Hindi as per request
    });

    useEffect(() => {
        localStorage.setItem('kr_user_location', location);
    }, [location]);

    useEffect(() => {
        localStorage.setItem('kr_user_language', language);
    }, [language]);

    const value = useMemo(() => ({
        location,
        setLocation,
        language,
        setLanguage
    }), [location, language]);

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
