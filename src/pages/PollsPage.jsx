import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import PollsSubnav from '../components/common/PollsSubnav';
import NoPollsIllustration from '../components/polls/NoPollsIllustration';
import pollService from '../services/pollService';
import { getOrCreatePollClientId } from '../utils/pollClientId';
import { usePollsAvailability } from '../contexts/PollsAvailabilityContext';

function PollCard({ poll, busy, onPick }) {
  const hasVoted = !!poll.hasVoted;
  const total = poll.totalVotes ?? 0;

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-4 py-4 sm:px-5 sm:py-5 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            Anonymous voting
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
          {poll.title}
        </h2>
        {poll.description ? (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{poll.description}</p>
        ) : null}
        <p className="mt-3 text-xs text-gray-500">
          {total.toLocaleString()} {total === 1 ? 'vote' : 'votes'} total
          {poll.expiresAt ? (
            <>
              {' · '}
              Closes{' '}
              {new Date(poll.expiresAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </>
          ) : null}
        </p>
      </div>

      <div className="p-4 sm:p-5 space-y-2">
        {(poll.options || []).map((opt) => {
          const pct = typeof opt.percent === 'number' ? opt.percent : 0;
          const selected = hasVoted && poll.selectedOptionIndex === opt.index;
          const showBar = hasVoted;
          const disabled = hasVoted || busy;

          return (
            <button
              key={`${poll._id}-opt-${opt.index}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(opt.index)}
              className={`relative w-full text-left rounded-lg border transition-colors overflow-hidden ${
                selected
                  ? 'border-[var(--color-primary)] bg-blue-50/60'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              } ${disabled && !hasVoted ? 'opacity-60 cursor-not-allowed' : ''} ${
                !hasVoted ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="relative min-h-[3rem] sm:min-h-[3.25rem]">
                {showBar && (
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--color-primary)]/10"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-3 px-3 py-2.5 sm:py-3">
                  <span className="text-sm sm:text-[15px] text-gray-900 leading-snug pr-2">
                    {opt.text}
                  </span>
                  <span className="flex items-center gap-2 shrink-0 text-sm text-gray-700">
                    {showBar && (
                      <>
                        <span className="tabular-nums font-medium">{pct}%</span>
                        <span className="text-gray-500 text-xs tabular-nums">
                          ({opt.votes ?? 0})
                        </span>
                      </>
                    )}
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {!hasVoted && busy && (
          <p className="text-xs text-gray-500 flex items-center gap-2 pt-1">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            Submitting…
          </p>
        )}
      </div>
    </article>
  );
}

export default function PollsPage() {
  const { activePolls: livePolls, loading: liveLoading, mergePoll, refresh } =
    usePollsAvailability();
  const [votingKey, setVotingKey] = useState(null);
  const [banner, setBanner] = useState('');
  const [clientId] = useState(() => getOrCreatePollClientId());

  const handleVoteLive = async (pollId, optionIndex) => {
    if (!clientId) {
      setBanner('This browser could not store an anonymous id for voting.');
      return;
    }
    try {
      setVotingKey(`live-${pollId}`);
      setBanner('');
      const resp = await pollService.vote(pollId, optionIndex, clientId);
      const updated = resp?.data;
      if (updated?._id) {
        mergePoll(updated);
      } else {
        await refresh();
      }
    } catch (e) {
      setBanner(
        e?.response?.data?.message ||
          e?.message ||
          'Could not record your vote.',
      );
    } finally {
      setVotingKey(null);
    }
  };

  return (
    <PageLayout activeTab="polls" contentClassName="bg-gray-50">
      <div className="w-full flex flex-col lg:flex-row lg:items-stretch min-h-[calc(100vh-4rem)]">
        <PollsSubnav active="polls" />

        <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8 pb-24 lg:pb-10">
          <header className="mb-6 sm:mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Polls
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Vote anonymously on this device. No account required.
            </p>
          </header>

          {banner && (
            <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900">
              {banner}
            </div>
          )}

          {liveLoading && (
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              Loading polls…
            </div>
          )}

          {!liveLoading && livePolls.length > 0 && (
            <section className="mb-10 sm:mb-12">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2 className="text-base font-semibold text-gray-900">Active polls</h2>
                <span className="text-xs text-gray-500 tabular-nums">
                  {livePolls.length} live
                </span>
              </div>
              <ul className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
                {livePolls.map((p) => (
                  <li key={p._id} className="min-w-0">
                    <PollCard
                      poll={p}
                      busy={votingKey === `live-${p._id}`}
                      onPick={(idx) => {
                        if (!p.hasVoted) handleVoteLive(p._id, idx);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!liveLoading && livePolls.length === 0 && <NoPollsIllustration />}
        </div>
      </div>
    </PageLayout>
  );
}
