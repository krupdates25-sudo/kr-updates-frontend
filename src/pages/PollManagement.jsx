import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import PollsSubnav from '../components/common/PollsSubnav';
import pollService from '../services/pollService';
import { usePollsAvailability } from '../contexts/PollsAvailabilityContext';

const emptyForm = () => ({
  title: '',
  description: '',
  options: ['', ''],
  isActive: true,
  expiresAt: '',
});

const PollManagement = () => {
  const { refresh: refreshPollsAvailability } = usePollsAvailability();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => emptyForm());
  const [editingId, setEditingId] = useState(null);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await pollService.getAllAdmin({ status, search });
      const inner = resp?.data;
      const list = Array.isArray(inner?.data) ? inner.data : [];
      setRows(list);
    } catch (e) {
      setError(e?.message || e?.response?.data?.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const setOptionAt = (i, v) => {
    setForm((p) => {
      const next = [...(p.options || [])];
      next[i] = v;
      return { ...p, options: next };
    });
  };

  const addOption = () => {
    setForm((p) => ({
      ...p,
      options: [...(p.options || []), ''].slice(0, 12),
    }));
  };

  const removeOption = (i) => {
    setForm((p) => {
      const next = (p.options || []).filter((_, idx) => idx !== i);
      return { ...p, options: next.length >= 2 ? next : ['', ''] };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const opts = form.options.map((t) => String(t).trim()).filter(Boolean);
    if (opts.length < 2) {
      setError('Add at least two options.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await pollService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        options: opts,
        isActive: form.isActive,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setForm(emptyForm());
      setShowForm(false);
      fetchRows();
      refreshPollsAvailability();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to create poll');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    const opts = form.options.map((t) => String(t).trim()).filter(Boolean);
    if (opts.length < 2) {
      setError('Add at least two options.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await pollService.update(editingId, {
        title: form.title.trim(),
        description: form.description.trim(),
        options: opts,
        isActive: form.isActive,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setForm(emptyForm());
      setEditingId(null);
      setShowForm(false);
      fetchRows();
      refreshPollsAvailability();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to update poll');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this poll and all votes?')) return;
    try {
      await pollService.delete(id);
      fetchRows();
      refreshPollsAvailability();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed');
    }
  };

  return (
    <PageLayout activeTab="admin-polls" hideBottomNav>
      <div className="w-full flex flex-col lg:flex-row lg:items-stretch min-h-screen bg-gray-50">
        <PollsSubnav active="admin" />
        <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-200 pb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage polls</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                <span className="font-medium text-gray-800">Create</span>,{' '}
                <span className="font-medium text-gray-800">edit</span>, set active/inactive, or{' '}
                <span className="font-medium text-gray-800">delete</span>. Active polls show on{' '}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">/polls</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm((v) => !v);
                if (!showForm) {
                  setEditingId(null);
                  setForm(emptyForm());
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--color-primary)] hover:brightness-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Close' : 'New poll'}
            </button>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title…"
                  className="pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-[var(--color-primary)]/25 focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg w-full sm:w-44 text-sm bg-white focus:ring-2 focus:ring-[var(--color-primary)]/25 focus:border-[var(--color-primary)] outline-none"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>

        {showForm && (
          <form
            onSubmit={editingId ? handleUpdate : handleCreate}
            className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-5 w-full"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Question *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                maxLength={2000}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Options * (2–12)</label>
                <button
                  type="button"
                  onClick={addOption}
                  disabled={(form.options || []).length >= 12}
                  className="text-xs font-semibold text-[var(--color-primary)] disabled:opacity-40"
                >
                  + Add option
                </button>
              </div>
              <div className="space-y-2">
                {(form.options || []).map((op, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={op}
                      onChange={(e) => setOptionAt(i, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={`Option ${i + 1}`}
                      maxLength={200}
                    />
                    {(form.options || []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Remove option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expires (optional)</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 pt-6 sm:pt-8">
                <input
                  id="poll-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="poll-active" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyForm());
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                type="submit"
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--color-primary)] hover:brightness-95 disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Update poll' : 'Create poll'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No polls yet.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rows.map((item) => (
                <div
                  key={item._id}
                  className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(item.options || []).length} options · {item.totalVotes ?? 0} votes ·{' '}
                      {item.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-500">Inactive</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item._id);
                        setForm({
                          title: item.title || '',
                          description: item.description || '',
                          options: (item.options || []).map((o) => o.text || ''),
                          isActive: item.isActive !== false,
                          expiresAt: item.expiresAt
                            ? new Date(item.expiresAt).toISOString().slice(0, 16)
                            : '',
                        });
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PollManagement;
