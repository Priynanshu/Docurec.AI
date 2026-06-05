import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Layers } from 'lucide-react';
import UploadZone from '../components/features/UploadZone';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const [mode, setMode] = useState('single');
  const navigate = useNavigate();

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

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="card p-6"
      >
        <UploadZone batch={mode === 'batch'} onSuccess={() => setTimeout(() => navigate('/documents'), 800)} />
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
