import { NavLink } from 'react-router-dom';
import { Home, BarChart2, PencilLine } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePollsAvailability } from '../../contexts/PollsAvailabilityContext';

/**
 * Left rail for /polls and /admin/polls — navigation + staff link to manage.
 */
export default function PollsSubnav({ active = 'polls' }) {
  const { user } = useAuth();
  const { hasActivePolls, loading: pollsLoading } = usePollsAvailability();
  const isStaff = user?.role === 'admin' || user?.role === 'moderator';
  const homePath = user ? '/dashboard' : '/';

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-100 text-gray-900 border border-gray-200'
        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
    }`;

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0 px-4 sm:px-6 lg:px-0 pt-4 lg:pt-0">
      <nav
        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm lg:rounded-none lg:border-0 lg:border-r lg:border-gray-200 lg:shadow-none lg:bg-gray-50/80 lg:min-h-[calc(100vh-4.5rem)] lg:p-4 lg:sticky lg:top-[4.5rem]"
        aria-label="Polls section"
      >
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Polls
        </p>
        <ul className="space-y-0.5">
          <li>
            <NavLink to={homePath} end className={linkClass}>
              <Home className="w-4 h-4 shrink-0 text-gray-500" />
              Home
            </NavLink>
          </li>
          {!pollsLoading && hasActivePolls && (
            <li>
              <NavLink to="/polls" className={linkClass}>
                <BarChart2 className="w-4 h-4 shrink-0 text-gray-500" />
                Vote on polls
              </NavLink>
            </li>
          )}
          {isStaff && (
            <li>
              <NavLink to="/admin/polls" className={linkClass}>
                <PencilLine className="w-4 h-4 shrink-0 text-gray-500" />
                Manage polls
              </NavLink>
            </li>
          )}
        </ul>
        {isStaff && active === 'admin' && (
          <p className="mt-3 px-3 pb-1 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
            Create new polls, edit options, turn polls on/off, or delete — actions are in the list
            below.
          </p>
        )}
      </nav>
    </aside>
  );
}
