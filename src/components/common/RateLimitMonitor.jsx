import { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const RateLimitMonitor = () => {
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remaining: null,
    limit: null,
    reset: null,
    userRole: null,
  });
  const { user } = useAuth();

  // Extract rate limit info from response headers
  useEffect(() => {
    // Only set up monitoring for admins and moderators
    if (!user || !['admin', 'moderator'].includes(user.role)) {
      return;
    }

    const originalFetch = window.fetch;

    window.fetch = function (...args) {
      return originalFetch.apply(this, args).then((response) => {
        // Extract rate limit headers
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const limit = response.headers.get('X-RateLimit-Limit');
        const reset = response.headers.get('X-RateLimit-Reset');
        const userRole = response.headers.get('X-RateLimit-UserRole');

        if (remaining !== null) {
          setRateLimitInfo({
            remaining: parseInt(remaining),
            limit: parseInt(limit),
            reset: reset ? new Date(parseInt(reset) * 1000) : null,
            userRole: userRole || user?.role,
          });
        }

        return response;
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [user]);

  const getStatusColor = () => {
    if (!rateLimitInfo.remaining || !rateLimitInfo.limit) return '#10B981'; // green

    const usage =
      ((rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit) *
      100;

    if (usage < 50) return '#10B981'; // green
    if (usage < 80) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getStatusIcon = () => {
    if (!rateLimitInfo.remaining || !rateLimitInfo.limit) {
      return <CheckCircle className="w-4 h-4" />;
    }

    const usage =
      ((rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit) *
      100;

    if (usage < 80) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatTimeUntilReset = () => {
    if (!rateLimitInfo.reset) return '';

    const now = new Date();
    const diffMs = rateLimitInfo.reset - now;

    if (diffMs <= 0) return 'Reset now';

    const minutes = Math.ceil(diffMs / (1000 * 60));
    return `${minutes}m`;
  };

  // Only show for admins and moderators
  if (!user || !['admin', 'moderator'].includes(user.role)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border p-3 min-w-[200px]"
        style={{ borderColor: getStatusColor() + '40' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-gray-900">
            Rate Limit Status
          </span>
          <div style={{ color: getStatusColor() }}>{getStatusIcon()}</div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Role:</span>
            <span
              className="font-medium capitalize"
              style={{ color: '#5755FE' }}
            >
              {rateLimitInfo.userRole || user?.role}
            </span>
          </div>

          {rateLimitInfo.remaining !== null && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Remaining:</span>
                <span
                  className="font-medium"
                  style={{ color: getStatusColor() }}
                >
                  {rateLimitInfo.remaining}/{rateLimitInfo.limit}
                </span>
              </div>

              {rateLimitInfo.reset && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reset in:</span>
                  <span className="font-medium text-gray-900">
                    {formatTimeUntilReset()}
                  </span>
                </div>
              )}

              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: getStatusColor(),
                      width: `${
                        (rateLimitInfo.remaining / rateLimitInfo.limit) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-1 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-purple-600" />
              <span className="text-gray-600">Live monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitMonitor;
