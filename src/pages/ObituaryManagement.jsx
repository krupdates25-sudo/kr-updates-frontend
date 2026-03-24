import { useCallback, useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Eye, EyeOff, Search, MapPin, Calendar, Edit } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import obituaryService from '../services/obituaryService';
import CloudinaryUpload from '../components/common/CloudinaryUpload';

const DEFAULT_FORM = {
  title: '',
  message: '',
  location: '',
  imageUrl: '',
  eventDate: new Date().toISOString().slice(0, 16),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
};

const ObituaryManagement = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await obituaryService.getAllAdmin({ status, search });
      setRows(resp?.data?.data || []);
    } catch (e) {
      setError(e?.message || 'Failed to load शोक संदेश entries');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await obituaryService.create({
        ...form,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setForm(DEFAULT_FORM);
      setShowForm(false);
      fetchRows();
    } catch (e2) {
      setError(e2?.message || 'Failed to create शोक संदेश');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setSaving(true);
      setError('');
      await obituaryService.update(editingId, {
        ...form,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setForm(DEFAULT_FORM);
      setEditingId(null);
      setShowForm(false);
      fetchRows();
    } catch (e2) {
      setError(e2?.message || 'Failed to update शोक संदेश');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await obituaryService.toggleStatus(id);
      fetchRows();
    } catch (e) {
      setError(e?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this शोक संदेश entry?')) return;
    try {
      await obituaryService.delete(id);
      fetchRows();
    } catch (e) {
      setError(e?.message || 'Failed to delete entry');
    }
  };

  return (
    <PageLayout activeTab="admin-obituaries" hideBottomNav>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">शोक संदेश Management</h1>
          <p className="text-gray-600 mt-1">Create and manage obituary/event quick updates carousel.</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg w-full sm:w-72"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => {
                setShowForm((v) => !v);
                if (!showForm) {
                  setEditingId(null);
                  setForm(DEFAULT_FORM);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Close Form' : 'Create शोक संदेश'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>

        {showForm && (
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea required rows={3} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Photo (optional)</label>
              <CloudinaryUpload
                type="image"
                currentImage={form.imageUrl}
                onUpload={(url) =>
                  setForm((p) => ({
                    ...p,
                    imageUrl: typeof url === 'string' ? url : (url?.url || ''),
                  }))
                }
                onRemove={() =>
                  setForm((p) => ({
                    ...p,
                    imageUrl: '',
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Event Date</label>
              <input type="datetime-local" value={form.eventDate} onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires At</label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button disabled={saving} type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60">
                {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No entries found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rows.map((item) => (
                <div key={item._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">{item.message}</p>
                    <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location || 'N/A'}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{item.eventDate ? new Date(item.eventDate).toLocaleDateString('hi-IN') : ''}</span>
                      <span className={`px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(item._id);
                        setForm({
                          title: item.title || '',
                          message: item.message || '',
                          location: item.location || '',
                          imageUrl: item.imageUrl || '',
                          eventDate: item.eventDate ? new Date(item.eventDate).toISOString().slice(0, 16) : '',
                          expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '',
                        });
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleToggle(item._id)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200" title="Toggle status">
                      {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ObituaryManagement;
