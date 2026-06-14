import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Upload as UploadIcon, Layers, User } from 'lucide-react';
import UploadZone from '../components/features/UploadZone';
import { citizenAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const [mode, setMode] = useState('single');
  // Optional: which citizen's folder to upload into. Empty = operator's own docs.
  const [citizenId, setCitizenId] = useState('');
  const navigate = useNavigate();

  // Load citizens list for the dropdown (lightweight, cached)
  const { data: citizensData } = useQuery({
    queryKey: ['citizens', { page: 1, forUpload: true }],
    queryFn: () => citizenAPI.getAll({ page: 1, limit: 100 }),
    staleTime: 60000,
  });
  const citizens = citizensData?.data || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Upload Documents</h1>
        <p className="text-text-tertiary text-sm mt-0.5">
          Upload Indian government, legal, or citizen-service documents for AI-powered OCR processing
        </p>
      </div>

      {}
      <div className="flex gap-2 p-1 bg-bg-elevated rounded-btn w-fit border border-border">
        {[
          { key: 'single', icon: UploadIcon, label: 'Single Upload' },
          { key: 'batch', icon: Layers, label: 'Batch Upload' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${mode === key ? 'bg-bg-secondary text-text-primary border border-border' : 'text-text-tertiary hover:text-text-secondary'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Citizen selector — choose whose folder this upload goes into */}
      <div className="card p-4">
        <label className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-sky" /> Upload for
        </label>
        <select
          value={citizenId}
          onChange={(e) => setCitizenId(e.target.value)}
          className="input text-sm"
        >
          <option value="">My Documents (not assigned to a citizen)</option>
          {citizens.map((c) => (
            <option key={c._id} value={c._id}>{c.name}{c.village ? ` — ${c.village}` : ''}</option>
          ))}
        </select>
        <p className="text-[10px] text-text-tertiary mt-1.5">
          Managing documents for villagers? Select their name here, or{' '}
          <a href="/citizens" className="text-sky hover:underline">add a new citizen</a>.
        </p>
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="card p-6"
      >
        <UploadZone
          batch={mode === 'batch'}
          citizenId={citizenId || null}
          onSuccess={() => setTimeout(() => navigate(citizenId ? `/citizens/${citizenId}` : '/documents'), 800)}
        />
      </motion.div>

      {}
      <div className="card p-5">
        <p className="text-xs font-medium text-text-secondary mb-3">Supported Document Types</p>
        <div className="flex flex-wrap gap-2">
          {['Aadhaar Card', 'PAN Card', 'Voter ID', 'Passport', 'Driving License', 'Land Records', 'Court Notices', 'Ration Card', 'Birth Certificate', 'School Certificate', 'Income Certificate', 'Caste Certificate', 'Bank Statements', 'Legal Notices'].map(t => (
            <span key={t} className="badge badge-sky text-[10px]">{t}</span>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-3">
          Supported languages: Hindi, English, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu
        </p>
      </div>
    </div>
  );
}
