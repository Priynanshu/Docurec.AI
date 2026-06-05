



import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldOff, Edit3, Check, X, MessageSquare,
  Download, Trash2, Languages, ArrowLeft, CheckCircle,
  AlertTriangle, RefreshCw, Zap, FileText, Clock, XCircle
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { Skeleton } from '../components/ui/skeleton';
import toast from 'react-hot-toast';


function ConfidenceBar({ score }) {
  const color = score >= 80 ? '#22D3EE' : score >= 60 ? '#F59E0B' : '#F87171';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{score}%</span>
    </div>
  );
}


function EditableField({ fieldKey, value, confidence, isMasked, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);

  const handleSave = () => { onSave(fieldKey, val); setEditing(false); };

  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-tertiary mb-0.5 capitalize">{fieldKey.replace(/_/g, ' ')}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <input value={val} onChange={e => setVal(e.target.value)}
              className="input text-sm py-1 flex-1" autoFocus />
            <button onClick={handleSave} className="text-success"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditing(false); setVal(value); }} className="text-text-tertiary">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-primary font-mono">
              {isMasked ? '••••••••••••' : (value || '—')}
            </p>
            {confidence < 70 && !isMasked && (
              <span className="badge-warning text-[10px]">Low confidence</span>
            )}
          </div>
        )}
        {!editing && <ConfidenceBar score={confidence || 0} />}
      </div>
      {!editing && !isMasked && (
        <button onClick={() => setEditing(true)} className="text-text-tertiary hover:text-sky mt-0.5 flex-shrink-0">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

const LANG_FLAGS = {
  hindi: '🇮🇳', english: '🇬🇧', bengali: '🇧🇩',
  tamil: '🇮🇳', telugu: '🇮🇳', marathi: '🇮🇳', gujarati: '🇮🇳',
};


function StatusBadge({ status }) {
  const configs = {
    completed:    { icon: CheckCircle, color: 'text-success',  bg: 'bg-[rgba(34,211,238,0.1)]',  label: 'Completed' },
    needs_review: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-[rgba(245,158,11,0.1)]', label: 'Needs Review' },
    processing:   { icon: Clock,       color: 'text-sky',      bg: 'bg-sky-muted',               label: 'Processing…' },
    queued:       { icon: Clock,       color: 'text-warning',  bg: 'bg-[rgba(245,158,11,0.1)]',  label: 'Queued' },
    failed:       { icon: XCircle,     color: 'text-error',    bg: 'bg-[rgba(248,113,113,0.1)]', label: 'Failed' },
  };
  const cfg = configs[status] || configs.queued;
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}


export default function DocumentDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const qc           = useQueryClient();
  const [activeTab, setActiveTab]         = useState('fields');
  const [translateLang, setTranslateLang] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating]     = useState(false);



  const fromDocumentChat = location.pathname.endsWith('/chat');


  const { data, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn:  () => documentAPI.getById(id),


    refetchInterval: (query) => {
      const status = query.state.data?.data?.document?.status;
      if (status === 'processing' || status === 'queued') return 3000;
      return false;
    },
    staleTime: 10000,
  });

  const doc = data?.data?.document;


  const prevStatusRef = useState(null);
  useEffect(() => {
    if (!doc) return;
    const prevStatus = prevStatusRef[0];
    if (
      (prevStatus === 'processing' || prevStatus === 'queued') &&
      (doc.status === 'completed' || doc.status === 'needs_review' || doc.status === 'failed')
    ) {
      if (doc.status === 'completed') toast.success('Document processed successfully!');
      else if (doc.status === 'needs_review') toast('Processing done — some fields need review', { icon: '⚠️' });
      else toast.error('Document processing failed');
    }
    prevStatusRef[0] = doc.status;
  }, [doc?.status]);


  const maskMutation = useMutation({
    mutationFn: ({ mask }) => documentAPI.maskPII(id, mask),
    onSuccess: () => {
      toast.success(doc?.isPIIMasked ? 'PII unmasked' : 'PII masked — Safe Share active');
      qc.invalidateQueries({ queryKey: ['document', id] });
    },
  });

  const correctMutation = useMutation({
    mutationFn: ({ field, value }) => documentAPI.correctField(id, field, value),
    onSuccess: () => {
      toast.success('Field updated');
      qc.invalidateQueries({ queryKey: ['document', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentAPI.delete(id),
    onSuccess: () => { toast.success('Document deleted'); navigate('/documents'); },
  });

  const handleTranslate = async () => {
    if (!translateLang) return;
    setTranslating(true);
    try {
      const res = await documentAPI.translate(id, translateLang);
      setTranslatedText(res.data.translatedText);
    } catch { toast.error('Translation failed'); }
    finally { setTranslating(false); }
  };

  const healthColor = (s) => s >= 80 ? 'text-success' : s >= 60 ? 'text-warning' : 'text-error';


  if (isLoading) return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    </div>
  );

  if (!doc) return (
    <div className="text-text-secondary text-center py-20">Document not found.</div>
  );


  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-text-primary truncate">
            {doc.title || doc.originalFileName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="badge-sky capitalize">{doc.documentType?.replace(/_/g, ' ')}</span>
            {doc.detectedLanguages?.map(l => (
              <span key={l} className="text-xs text-text-tertiary">{LANG_FLAGS[l] || ''} {l}</span>
            ))}
            <StatusBadge status={doc.status} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {doc.hasPII && (
            <button
              onClick={() => maskMutation.mutate({ mask: !doc.isPIIMasked })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors
                ${doc.isPIIMasked
                  ? 'border-success/30 bg-[rgba(34,211,238,0.1)] text-success'
                  : 'border-warning/30 bg-[rgba(245,158,11,0.1)] text-warning'}`}
            >
              {doc.isPIIMasked
                ? <><Shield className="w-3.5 h-3.5" /> PII Safe</>
                : <><ShieldOff className="w-3.5 h-3.5" /> Mask PII</>}
            </button>
          )}
          {}
          <Link
            to={`/documents/${id}/chat`}
            className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Ask AI
          </Link>
          <button onClick={() => deleteMutation.mutate()} className="btn-ghost text-xs p-2 hover:text-error">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {}
      {(doc.status === 'processing' || doc.status === 'queued') && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-sky-muted border border-sky/20 rounded-card"
        >
          <div className="relative w-5 h-5 flex-shrink-0">
            <Zap className="w-5 h-5 text-sky animate-pulse" />
          </div>
          <div>
            <p className="text-sky text-sm font-medium">AI is processing your document…</p>
            <p className="text-text-tertiary text-xs">This page will update automatically. No need to refresh.</p>
          </div>
          <RefreshCw className="w-4 h-4 text-sky animate-spin ml-auto flex-shrink-0" />
        </motion.div>
      )}

      {}
      {doc.status === 'failed' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-[rgba(248,113,113,0.1)] border border-error/20 rounded-card"
        >
          <XCircle className="w-5 h-5 text-error flex-shrink-0" />
          <div>
            <p className="text-error text-sm font-medium">Processing failed</p>
            <p className="text-text-tertiary text-xs">{doc.processingError || 'An error occurred during processing.'}</p>
          </div>
        </motion.div>
      )}

      {}
      {doc.status === 'needs_review' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-[rgba(245,158,11,0.1)] border border-warning/20 rounded-card"
        >
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-warning text-sm font-medium">Some fields need your review</p>
            <p className="text-text-tertiary text-xs">Low confidence extraction — click any field to correct it.</p>
          </div>
        </motion.div>
      )}

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {}
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Original Document</span>
            {doc.imageKit?.url && (
              <a href={doc.imageKit.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-sky hover:underline flex items-center gap-1">
                <Download className="w-3 h-3" /> Download
              </a>
            )}
          </div>
          <div className="relative bg-bg-elevated min-h-80 flex items-center justify-center">
            {doc.imageKit?.url ? (
              <img src={doc.imageKit.url} alt="Document"
                className="max-w-full max-h-[500px] object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-tertiary p-10">
                <FileText className="w-12 h-12" />
                <p className="text-sm">No preview available</p>
              </div>
            )}
            {}
            {(doc.status === 'processing' || doc.status === 'queued') && (
              <div className="absolute inset-0 bg-bg-primary/40 flex flex-col items-center justify-center gap-3">
                <div className="scan-overlay" />
                <Zap className="w-8 h-8 text-sky animate-pulse" />
                <p className="text-sky text-sm font-medium">AI Processing…</p>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="card flex flex-col overflow-hidden">
          {}
          <div className="flex border-b border-border">
            {[
              { key: 'fields', label: 'Extracted Fields' },
              { key: 'text',   label: 'Full Text' },
              { key: 'health', label: 'Health Score' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-xs font-medium transition-colors
                  ${activeTab === tab.key
                    ? 'text-sky border-b-2 border-sky'
                    : 'text-text-tertiary hover:text-text-secondary'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">

              {}
              {activeTab === 'fields' && (
                <motion.div key="fields"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {doc.extractedFields?.length > 0 ? (
                    doc.extractedFields.map((field) => (
                      <EditableField
                        key={field.key}
                        fieldKey={field.key}
                        value={field.value}
                        confidence={field.confidence}
                        isMasked={field.isMasked}
                        onSave={(f, v) => correctMutation.mutate({ field: f, value: v })}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-tertiary">
                      {doc.status === 'processing' || doc.status === 'queued' ? (
                        <>
                          <RefreshCw className="w-8 h-8 mx-auto mb-2 text-sky animate-spin" />
                          <p className="text-sm text-sky">Extracting fields…</p>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-text-tertiary/50" />
                          <p className="text-sm">No fields extracted</p>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {}
              {activeTab === 'text' && (
                <motion.div key="text"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4">

                  {}
                  <div className="bg-bg-elevated rounded-lg p-4 border border-border">
                    <p className="text-xs font-medium text-text-secondary mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky" />
                      Extracted Content
                    </p>
                    {doc.extractedText ? (
                      <pre className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-sans max-h-72 overflow-y-auto">
                        {doc.extractedText}
                      </pre>
                    ) : (
                      <p className="text-text-tertiary text-sm italic">
                        {doc.status === 'processing' || doc.status === 'queued'
                          ? 'Text will appear here once processing is complete…'
                          : 'No text could be extracted from this document.'}
                      </p>
                    )}
                  </div>

                  {}
                  <div className="border border-border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-sky" /> Translate to another language
                    </p>
                    <div className="flex gap-2">
                      <select value={translateLang} onChange={e => setTranslateLang(e.target.value)}
                        className="input text-xs py-1.5 flex-1">
                        <option value="">Select language</option>
                        {['English','Hindi','Bengali','Tamil','Telugu','Marathi','Gujarati','Kannada'].map(l => (
                          <option key={l} value={l.toLowerCase()}>{l}</option>
                        ))}
                      </select>
                      <button onClick={handleTranslate} disabled={!translateLang || translating}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-40">
                        {translating
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Languages className="w-3.5 h-3.5" />}
                        Go
                      </button>
                    </div>
                    {translatedText && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="bg-bg-elevated rounded p-3 border border-border max-h-48 overflow-y-auto">
                        <pre className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
                          {translatedText}
                        </pre>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {}
              {activeTab === 'health' && (
                <motion.div key="health"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4">

                  {}
                  <div className="flex items-center gap-4 p-4 bg-bg-elevated rounded-lg">
                    <div className="text-4xl font-bold"
                      style={{ color: doc.healthScore >= 80 ? '#22D3EE' : doc.healthScore >= 60 ? '#F59E0B' : '#F87171' }}>
                      {doc.healthScore || 0}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Health Score</p>
                      <p className="text-xs text-text-tertiary">Overall document quality</p>
                    </div>
                  </div>

                  {}
                  {doc.healthDetails && ['clarity', 'completeness', 'readability'].map(key => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary capitalize">{key}</span>
                        <span className={`text-xs font-medium ${healthColor(doc.healthDetails[key] || 0)}`}>
                          {doc.healthDetails[key] || 0}%
                        </span>
                      </div>
                      <ConfidenceBar score={doc.healthDetails[key] || 0} />
                    </div>
                  ))}

                  {}
                  {doc.healthDetails?.suggestions?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-text-secondary">Suggestions</p>
                      {doc.healthDetails.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-text-tertiary bg-bg-elevated p-2.5 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
