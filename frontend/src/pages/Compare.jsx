import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Plus, Minus, RefreshCw, FileText } from 'lucide-react';
import { documentAPI } from '../services/api';
import toast from 'react-hot-toast';

function DocPicker({ label, selected, onSelect, docs }) {
  return (
    <div className="card p-4 flex-1">
      <p className="text-xs font-medium text-text-secondary mb-3">{label}</p>
      {selected ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bg-elevated rounded-lg flex items-center justify-center overflow-hidden">
            {selected.imageKit?.thumbnailUrl
              ? <img src={selected.imageKit.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              : <FileText className="w-4 h-4 text-text-tertiary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{selected.title || selected.originalFileName}</p>
            <span className="badge-sky text-[10px]">{selected.documentType?.replace(/_/g, ' ')}</span>
          </div>
          <button onClick={() => onSelect(null)} className="text-text-tertiary hover:text-error"><Minus className="w-4 h-4" /></button>
        </div>
      ) : (
        <select
          className="input text-sm"
          onChange={e => {
            const doc = docs.find(d => d._id === e.target.value);
            onSelect(doc || null);
          }}
          defaultValue=""
        >
          <option value="">Select document…</option>
          {docs.map(d => (
            <option key={d._id} value={d._id}>{d.title || d.originalFileName}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export default function Compare() {
  const [doc1, setDoc1] = useState(null);
  const [doc2, setDoc2] = useState(null);
  const [diff, setDiff] = useState(null);
  const [comparing, setComparing] = useState(false);

  const { data } = useQuery({
    queryKey: ['documents', { limit: 50 }],
    queryFn: () => documentAPI.getAll({ limit: 50, status: 'completed' }),
    staleTime: 60000,
  });

  const docs = data?.data || [];

  const handleCompare = async () => {
    if (!doc1 || !doc2) return toast.error('Select both documents');
    if (doc1._id === doc2._id) return toast.error('Select two different documents');
    setComparing(true);
    try {
      const res = await documentAPI.compare(doc1._id, doc2._id);
      setDiff(res.data.diff);
    } catch { toast.error('Comparison failed'); }
    finally { setComparing(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-sky" /> Document Comparison
        </h1>
        <p className="text-text-tertiary text-sm mt-0.5">Compare two document versions to see field-level changes</p>
      </div>

      {/* Doc pickers */}
      <div className="flex gap-4 items-stretch">
        <DocPicker label="Document A" selected={doc1} onSelect={setDoc1} docs={docs.filter(d => d._id !== doc2?._id)} />
        <div className="flex items-center text-text-tertiary">
          <GitCompare className="w-5 h-5" />
        </div>
        <DocPicker label="Document B" selected={doc2} onSelect={setDoc2} docs={docs.filter(d => d._id !== doc1?._id)} />
      </div>

      <button
        onClick={handleCompare}
        disabled={!doc1 || !doc2 || comparing}
        className="btn-primary flex items-center gap-2 disabled:opacity-40"
      >
        {comparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
        {comparing ? 'Comparing…' : 'Compare Documents'}
      </button>

      {/* Diff results */}
      <AnimatePresence>
        {diff && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            {diff.summary && (
              <div className="card p-4 border-sky/20 bg-sky-muted">
                <p className="text-sm text-text-primary">{diff.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Changed */}
              {diff.changed?.length > 0 && (
                <div className="card p-4 sm:col-span-3">
                  <p className="text-xs font-medium text-warning mb-3 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Changed Fields ({diff.changed.length})
                  </p>
                  <div className="space-y-2">
                    {diff.changed.map((c, i) => (
                      <div key={i} className="grid grid-cols-3 gap-3 text-xs bg-bg-elevated p-3 rounded-lg">
                        <p className="text-text-secondary capitalize font-medium">{c.field?.replace(/_/g, ' ')}</p>
                        <p className="text-error font-mono line-through opacity-70">{c.oldValue || '—'}</p>
                        <p className="text-success font-mono">{c.newValue || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Added */}
              {diff.added?.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-medium text-success mb-3 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Added ({diff.added.length})
                  </p>
                  {diff.added.map((a, i) => (
                    <div key={i} className="text-xs bg-[rgba(34,211,238,0.05)] border border-success/20 p-2 rounded mb-1 font-mono text-success">{a}</div>
                  ))}
                </div>
              )}

              {/* Removed */}
              {diff.removed?.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-medium text-error mb-3 flex items-center gap-1.5">
                    <Minus className="w-3.5 h-3.5" /> Removed ({diff.removed.length})
                  </p>
                  {diff.removed.map((r, i) => (
                    <div key={i} className="text-xs bg-[rgba(248,113,113,0.05)] border border-error/20 p-2 rounded mb-1 font-mono text-error">{r}</div>
                  ))}
                </div>
              )}
            </div>

            {!diff.changed?.length && !diff.added?.length && !diff.removed?.length && (
              <div className="card p-8 text-center">
                <p className="text-success font-medium">No differences found</p>
                <p className="text-text-tertiary text-sm mt-1">The two documents appear identical</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
