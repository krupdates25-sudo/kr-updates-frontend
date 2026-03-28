import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import pollService from '../services/pollService';
import { getOrCreatePollClientId } from '../utils/pollClientId';

const PollsAvailabilityContext = createContext({
  activePolls: [],
  hasActivePolls: false,
  loading: true,
  refresh: async () => {},
  mergePoll: () => {},
});

export function PollsAvailabilityProvider({ children }) {
  const location = useLocation();
  const [activePolls, setActivePolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);

  const fetchPolls = useCallback(async () => {
    const clientId = getOrCreatePollClientId();
    if (!clientId) {
      setActivePolls([]);
      setLoading(false);
      initialFetchDone.current = true;
      return;
    }
    const showLoading = !initialFetchDone.current;
    if (showLoading) setLoading(true);
    try {
      const resp = await pollService.getActive(clientId);
      const rows = Array.isArray(resp?.data) ? resp.data : [];
      setActivePolls(rows);
    } catch {
      setActivePolls([]);
    } finally {
      if (showLoading) {
        setLoading(false);
        initialFetchDone.current = true;
      }
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls, location.pathname]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchPolls();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fetchPolls]);

  const mergePoll = useCallback((updated) => {
    if (!updated?._id) return;
    setActivePolls((prev) =>
      prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)),
    );
  }, []);

  const value = useMemo(
    () => ({
      activePolls,
      hasActivePolls: activePolls.length > 0,
      loading,
      refresh: fetchPolls,
      mergePoll,
    }),
    [activePolls, loading, fetchPolls, mergePoll],
  );

  return (
    <PollsAvailabilityContext.Provider value={value}>
      {children}
    </PollsAvailabilityContext.Provider>
  );
}

export function usePollsAvailability() {
  return useContext(PollsAvailabilityContext);
}
