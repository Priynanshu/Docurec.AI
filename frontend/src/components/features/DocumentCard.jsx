


import { motion } from 'framer-motion';
import { FileText, Shield, AlertTriangle, CheckCircle, Clock, Eye, Trash2, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';


const TYPE_LABELS = {
  aadhaar: 'Aadhaar', pan: 'PAN', voter_id: 'Voter ID', passport: 'Passport',
  driving_license: 'DL', land_record: 'Land Record', court_notice: 'Court Notice',
  ration_card: 'Ration Card', birth_certificate: 'Birth Cert', other: 'Document',
};


const STATUS_CONFIG = {
  completed:    { icon: CheckCircle, color: 'text-success', bg: 'bg-[rgba(34,211,238,0.1)]',  label: 'Done' },
  processing:   { icon: Clock,       color: 'text-sky',     bg: 'bg-sky-muted',               label: 'Processing' },
  queued:       { icon: Clock,       color: 'text-warning', bg: 'bg-[rgba(245,158,11,0.1)]',  label: 'Queued' },
  failed:       { icon: AlertTriangle, color: 'text-error', bg: 'bg-[rgba(248,113,113,0.1)]', label: 'Failed' },
  needs_review: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-[rgba(245,158,11,0.1)]', label: 'Review' },
};


const LANG_FLAGS = {
  hindi: '🇮🇳', english: '🇬🇧', bengali: '🇧🇩',
  tamil: '🇮🇳', telugu: '🇮🇳', marathi: '🇮🇳',
};


function ConfidenceArc({ score }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22D3EE' : score >= 60 ? '#F59E0B' : '#F87171';

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        {}
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#2A2A38" strokeWidth="3" />
        {}
        <motion.circle
          cx="22" cy="22" r={radius}
          fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      {}
      <span className="absolute text-[10px] font-semibold" style={{ color }}>{score}%</span>
    </div>
  );
}


export function DocumentCardSkeleton() {
  return (
    <div className="card p-4">
      <Skeleton className="w-full h-32 rounded-lg mb-3" />
      <Skeleton className="h-3 w-3/4 rounded mb-2" />
      <Skeleton className="h-3 w-1/2 rounded mb-2" />
      <Skeleton className="h-3 w-1/3 rounded" />
    </div>
  );
}

export default function DocumentCard({ doc, onDelete, index = 0 }) {
  const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.queued;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="card p-4 group cursor-pointer hover:border-border-hover transition-all duration-200"
    >
      <Link to={`/documents/${doc._id}`} className="block">
        {}
        <div className="relative w-full h-36 bg-bg-elevated rounded-lg mb-3 overflow-hidden flex items-center justify-center">
          {doc.imageKit?.url ? (
            <img src={doc.imageKit.url} alt={doc.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <FileText className="w-10 h-10 text-text-tertiary" />
          )}

          {}
          <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-medium ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </div>

          {}
          {doc.hasPII && (
            <div className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-pill text-[10px] ${doc.isPIIMasked ? 'bg-[rgba(34,211,238,0.15)] text-success' : 'bg-[rgba(245,158,11,0.15)] text-warning'}`}>
              <Shield className="w-3 h-3" />
              {doc.isPIIMasked ? 'Safe' : 'PII'}
            </div>
          )}

          {}
          {doc.status === 'processing' && (
            <div className="absolute inset-0 bg-bg-primary/30">
              <div className="scan-overlay" />
            </div>
          )}
        </div>

        {}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate mb-0.5">
              {doc.title || doc.originalFileName}
            </p>
            <span className="badge-sky text-[10px]">
              {TYPE_LABELS[doc.documentType] || 'Document'}
            </span>
          </div>
          <ConfidenceArc score={doc.confidenceScore || 0} />
        </div>

        {}
        {doc.detectedLanguages?.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Languages className="w-3 h-3 text-text-tertiary" />
            {doc.detectedLanguages.slice(0, 3).map((lang) => (
              <span key={lang} className="text-[10px] text-text-tertiary capitalize">
                {LANG_FLAGS[lang] || ''} {lang}
              </span>
            ))}
          </div>
        )}
      </Link>

      {}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/documents/${doc._id}`} className="btn-ghost text-xs flex items-center gap-1 flex-1 justify-center py-1.5">
          <Eye className="w-3.5 h-3.5" /> View
        </Link>
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(doc._id); }}
            className="btn-ghost text-xs flex items-center gap-1 px-3 py-1.5 hover:text-error"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
