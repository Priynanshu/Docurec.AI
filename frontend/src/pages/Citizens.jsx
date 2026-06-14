// ─────────────────────────────────────────────────────────────────────────────
// Citizens Page
// This is the "multi-user" feature for CSC operators.
//
// A CSC operator manages documents for MANY citizens (villagers). This page
// is the directory of all citizens an operator has added — each citizen has
// their own folder of documents, separate from the operator's own documents.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Plus, Search, Phone, MapPin, FileText,
  Trash2, X, Loader2, UserPlus, ChevronRight,
} from 'lucide-react';
import { citizenAPI } from '../services/api';
import { Skeleton } from '../components/ui/skeleton';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

// ── Add Citizen Modal ─────────────────────────────────────────────────────────
function AddCitizenModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', phone: '', village: '', district: '', state: '', notes: '' });

  const createMutation = useMutation({
    mutationFn: () => citizenAPI.create(form),
    onSuccess: (res) => {
      toast.success('Citizen added');
      onCreated(res.data.citizen);
      setForm({ name: '', phone: '', village: '', district: '', state: '', notes: '' });
      onClose();
    },
    onError: (err) => toast.error(err?.message || 'Could not add citizen'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    createMutation.mutate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky" /> Add Citizen
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Full Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input text-sm"
              placeholder="e.g. Suresh Kumar"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input text-sm"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Village</label>
              <input
                value={form.village}
                onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
                className="input text-sm"
                placeholder="e.g. Rampur"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">District</label>
              <input
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                className="input text-sm"
                placeholder="e.g. Patna"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">State</label>
              <input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className="input text-sm"
                placeholder="e.g. Bihar"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1 block">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="input text-sm resize-none"
              rows={2}
              placeholder="Any extra info..."
            />
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Citizen
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Citizen Card ───────────────────────────────────────────────────────────────
function CitizenCard({ citizen, index, onDelete }) {
  const initials = citizen.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const location = [citizen.village, citizen.district, citizen.state].filter(Boolean).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className="card p-4 group hover:border-border-hover transition-all duration-200"
    >
      <Link to={`/citizens/${citizen._id}`} className="block">
        <div className="flex items-start gap-3">
          {/* Avatar / initials */}
          <div className="w-11 h-11 rounded-full bg-sky-muted border border-sky/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sky text-sm font-semibold">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{citizen.name}</p>
            {location && (
              <p className="text-xs text-text-tertiary truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" /> {location}
              </p>
            )}
            {citizen.phone && (
              <p className="text-xs text-text-tertiary truncate flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 flex-shrink-0" /> {citizen.phone}
              </p>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-sky transition-colors flex-shrink-0 mt-1" />
        </div>

        {/* Document count badge */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <span className="badge-sky text-[10px] flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {citizen.documentCount || 0} document{citizen.documentCount === 1 ? '' : 's'}
          </span>
        </div>
      </Link>

      {/* Delete action */}
      <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); onDelete(citizen._id); }}
          className="btn-ghost text-xs flex items-center gap-1 px-2 py-1 hover:text-error"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Citizens() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['citizens', { page, search: debouncedSearch }],
    queryFn: () => citizenAPI.getAll({ page, limit: 20, search: debouncedSearch || undefined }),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: citizenAPI.delete,
    onSuccess: () => {
      toast.success('Citizen removed');
      qc.invalidateQueries({ queryKey: ['citizens'] });
    },
    onError: () => toast.error('Failed to remove citizen'),
  });

  const citizens = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  const handleDelete = (id) => {
    if (window.confirm('Remove this citizen? Their documents will remain but become unassigned.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-sky" /> Citizens
          </h1>
          <p className="text-text-tertiary text-sm mt-0.5">
            Manage documents for the people you serve
            {pagination?.total != null && ` · ${pagination.total} citizen${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Citizen
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input pl-9 text-sm"
          placeholder="Search by name, phone, village…"
        />
      </div>

      {/* Citizens grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-24 rounded-pill" />
            </div>
          ))}
        </div>
      ) : citizens.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {citizens.map((citizen, i) => (
            <CitizenCard key={citizen._id} citizen={citizen} index={i} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-16 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center">
            <Users className="w-7 h-7 text-text-tertiary" />
          </div>
          <p className="text-text-secondary font-medium">
            {search ? 'No citizens found' : 'No citizens added yet'}
          </p>
          <p className="text-text-tertiary text-sm max-w-sm">
            {search
              ? 'Try a different search term'
              : 'Add citizens to organize and manage documents for each person you serve — perfect for CSC operators handling multiple villagers.'}
          </p>
          {!search && (
            <button onClick={() => setModalOpen(true)} className="btn-primary text-sm mt-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add your first citizen
            </button>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
          <span className="text-text-tertiary text-sm px-2">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Add Citizen Modal */}
      <AnimatePresence>
        {modalOpen && (
          <AddCitizenModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={() => qc.invalidateQueries({ queryKey: ['citizens'] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
