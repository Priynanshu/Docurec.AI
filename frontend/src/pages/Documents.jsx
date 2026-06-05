import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';
import DocumentCard from '../components/features/DocumentCard';
import { Skeleton } from '../components/ui/skeleton';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

const STATUS_OPTIONS = ['', 'completed', 'needs_review', 'failed', 'queued', 'processing'];
const TYPE_OPTIONS = ['', 'aadhaar', 'pan', 'voter_id', 'passport', 'land_record', 'court_notice', 'ration_card', 'other'];
const LANG_OPTIONS = ['', 'hindi', 'english', 'bengali', 'tamil', 'telugu', 'marathi', 'gujarati'];

export default function Documents() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');

  const debouncedSearch = useDebounce(search, 400);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { page, status, type, language, search: debouncedSearch }],
    queryFn: () => documentAPI.getAll({ page, limit: 12, status: status || undefined, type: type || undefined, language: language || undefined, search: debouncedSearch || undefined }),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: documentAPI.delete,
    onSuccess: () => {
      toast.success('Document deleted');
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const docs = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  const clearFilters = () => { setSearch(''); setStatus(''); setType(''); setLanguage(''); setPage(1); };
  const hasFilters = search || status || type || language;

  const selectStyle = "input text-xs py-1.5 cursor-pointer";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Document Library</h1>
          <p className="text-text-tertiary text-sm mt-0.5">
            {pagination?.total != null ? `${pagination.total} document${pagination.total !== 1 ? 's' : ''}` : '—'}
          </p>
        </div>
        <Link to="/upload" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Upload
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9 text-sm"
            placeholder="Search documents…"
          />
        </div>

        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectStyle}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>

        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={selectStyle}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.slice(1).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>

        <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} className={selectStyle}>
          <option value="">All Languages</option>
          {LANG_OPTIONS.slice(1).map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost text-xs text-text-tertiary">
            Clear filters
          </button>
        )}

        <div className="flex items-center border border-border rounded-btn overflow-hidden ml-auto">
          <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-bg-elevated text-sky' : 'text-text-tertiary'}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-bg-elevated text-sky' : 'text-text-tertiary'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Documents grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="" />
              <div className="skeleton h-3 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : docs.length > 0 ? (
        <div className={view === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
          : 'space-y-2'
        }>
          {docs.map((doc, i) => (
            view === 'grid' ? (
              <DocumentCard key={doc._id} doc={doc} index={i} onDelete={() => deleteMutation.mutate(doc._id)} />
            ) : (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-4 flex items-center gap-4 hover:border-border-hover transition-colors"
              >
                <div className="w-12 h-12 bg-bg-elevated rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {doc.imageKit?.thumbnailUrl ? (
                    <img src={doc.imageKit.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-5 h-5 text-text-tertiary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{doc.title || doc.originalFileName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge-sky text-[10px] capitalize">{doc.documentType?.replace(/_/g, ' ')}</span>
                    {doc.detectedLanguages?.slice(0, 2).map(l => (
                      <span key={l} className="text-[10px] text-text-tertiary capitalize">{l}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-text-primary">{doc.confidenceScore || 0}%</p>
                  <p className="text-[10px] text-text-tertiary">{doc.status}</p>
                </div>
                <Link to={`/documents/${doc._id}`} className="btn-secondary text-xs px-3 py-1.5">View</Link>
              </motion.div>
            )
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-16 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center">
            <FileText className="w-7 h-7 text-text-tertiary" />
          </div>
          <p className="text-text-secondary font-medium">No documents found</p>
          <p className="text-text-tertiary text-sm">{hasFilters ? 'Try adjusting your filters' : 'Upload your first document to get started'}</p>
          {!hasFilters && <Link to="/upload" className="btn-primary text-sm mt-2">Upload now</Link>}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
          <span className="text-text-tertiary text-sm px-2">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
