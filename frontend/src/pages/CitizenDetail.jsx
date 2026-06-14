// ─────────────────────────────────────────────────────────────────────────────
// Citizen Detail Page
// Shows one citizen's profile + the folder of documents that belong to them.
// Operator can upload new documents directly into this citizen's folder,
// edit the citizen's profile, and browse/manage their documents — same
// DocumentCard UI as the main Documents page, just scoped to this citizen.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, MapPin, FileText, Edit3, Check, X,
  Upload as UploadIcon, Loader2, Trash2, Users,
} from 'lucide-react';
import { citizenAPI, documentAPI } from '../services/api';
import DocumentCard from '../components/features/DocumentCard';
import UploadZone from '../components/features/UploadZone';
import { Skeleton } from '../components/ui/skeleton';
import toast from 'react-hot-toast';

// ── Editable profile field ────────────────────────────────────────────────────
function ProfileField({ label, value, fieldKey, icon: Icon, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');

  const handleSave = () => {
    onSave(fieldKey, val);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-tertiary">{label}</p>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="input text-sm py-1 flex-1"
              autoFocus
            />
            <button onClick={handleSave} className="text-success"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setEditing(false); setVal(value || ''); }} className="text-text-tertiary">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-text-primary">{value || '—'}</p>
        )}
      </div>
      {!editing && (
        <button onClick={() => setEditing(true)} className="text-text-tertiary hover:text-sky flex-shrink-0">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function CitizenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [page, setPage] = useState(1);

  // ── Fetch citizen profile ────────────────────────────────────────────────────
  const { data: citizenData, isLoading: citizenLoading } = useQuery({
    queryKey: ['citizen', id],
    queryFn: () => citizenAPI.getById(id),
    staleTime: 60000,
  });

  // ── Fetch citizen's documents ─────────────────────────────────────────────────
  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['citizenDocuments', id, { page }],
    queryFn: () => citizenAPI.getDocuments(id, { page, limit: 12 }),
    staleTime: 20000,
    // Auto-refresh while any document is still processing
    refetchInterval: (query) => {
      const docs = query.state.data?.data || [];
      const hasProcessing = docs.some((d) => d.status === 'processing' || d.status === 'queued');
      return hasProcessing ? 4000 : false;
    },
  });

  const citizen = citizenData?.data?.citizen;
  const docs = docsData?.data || [];
  const pagination = docsData?.pagination;
  const totalPages = pagination?.totalPages || 1;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data) => citizenAPI.update(id, data),
    onSuccess: () => {
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['citizen', id] });
      qc.invalidateQueries({ queryKey: ['citizens'] });
    },
    onError: () => toast.error('Could not update profile'),
  });

  const deleteDocMutation = useMutation({
    mutationFn: documentAPI.delete,
    onSuccess: () => {
      toast.success('Document deleted');
      qc.invalidateQueries({ queryKey: ['citizenDocuments', id] });
      qc.invalidateQueries({ queryKey: ['citizen', id] });
      qc.invalidateQueries({ queryKey: ['citizens'] });
    },
  });

  const handleFieldSave = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (citizenLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Citizen not found.</p>
        <Link to="/citizens" className="text-sky text-sm hover:underline mt-2 inline-block">
          ← Back to Citizens
        </Link>
      </div>
    );
  }

  const initials = citizen.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const location = [citizen.village, citizen.district, citizen.state].filter(Boolean).join(', ');

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/citizens')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-sky" /> Citizen Profile
          </h1>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-sky-muted border border-sky/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sky text-xl font-semibold">{initials}</span>
          </div>

          {/* Editable fields */}
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 divide-y sm:divide-y-0 divide-border">
            <ProfileField label="Full Name" value={citizen.name} fieldKey="name" onSave={handleFieldSave} />
            <ProfileField label="Phone" value={citizen.phone} fieldKey="phone" icon={Phone} onSave={handleFieldSave} />
            <ProfileField label="Village" value={citizen.village} fieldKey="village" icon={MapPin} onSave={handleFieldSave} />
            <ProfileField label="District" value={citizen.district} fieldKey="district" onSave={handleFieldSave} />
            <ProfileField label="State" value={citizen.state} fieldKey="state" onSave={handleFieldSave} />
            <ProfileField label="Notes" value={citizen.notes} fieldKey="notes" onSave={handleFieldSave} />
          </div>
        </div>

        {location && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="badge-sky text-[10px] flex items-center gap-1 w-fit">
              <MapPin className="w-3 h-3" /> {location}
            </span>
          </div>
        )}
      </div>

      {/* Documents section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky" />
            Documents
            {pagination?.total != null && (
              <span className="text-text-tertiary text-sm font-normal">({pagination.total})</span>
            )}
          </h2>
          <button onClick={() => setShowUpload((v) => !v)} className="btn-primary flex items-center gap-2 text-sm">
            <UploadIcon className="w-4 h-4" /> {showUpload ? 'Hide Upload' : 'Upload Document'}
          </button>
        </div>

        {/* Upload zone — scoped to this citizen via citizenId prop */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-6 overflow-hidden"
            >
              <p className="text-xs text-text-tertiary mb-3">
                Documents uploaded here will be saved to <span className="text-sky font-medium">{citizen.name}'s</span> folder.
              </p>
              <UploadZone
                batch
                citizenId={id}
                onSuccess={() => setTimeout(() => setShowUpload(false), 800)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents grid */}
        {docsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-3">
                <Skeleton className="w-full h-32 rounded-lg" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : docs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {docs.map((doc, i) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                index={i}
                onDelete={() => deleteDocMutation.mutate(doc._id)}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center">
              <FileText className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="text-text-secondary font-medium">No documents yet</p>
            <p className="text-text-tertiary text-sm">
              Upload {citizen.name}'s documents — Aadhaar, PAN, land records, and more.
            </p>
            {!showUpload && (
              <button onClick={() => setShowUpload(true)} className="btn-primary text-sm mt-2 flex items-center gap-2">
                <UploadIcon className="w-4 h-4" /> Upload Document
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
            <span className="text-text-tertiary text-sm px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
