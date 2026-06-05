import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { documentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tif', '.tiff'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

function FileItem({ file, status, progress }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-border"
    >
      <FileText className="w-4 h-4 text-text-tertiary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{file.name}</p>
        <p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(0)} KB</p>
        {status === 'uploading' && (
          <div className="mt-1 h-1 bg-bg-primary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sky rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {status === 'uploading' && <Loader2 className="w-4 h-4 text-sky animate-spin" />}
        {status === 'done' && <CheckCircle className="w-4 h-4 text-success" />}
        {status === 'error' && <AlertCircle className="w-4 h-4 text-error" />}
      </div>
    </motion.div>
  );
}

export default function UploadZone({ onSuccess, batch = false }) {
  const [files, setFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 10 * 1024 * 1024,
    multiple: batch,
    onDropRejected: (rejected) => {
      rejected.forEach((r) => toast.error(`${r.file.name}: ${r.errors[0].message}`));
    },
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (!files.length) return;
    setIsUploading(true);

    try {
      if (batch && files.length > 1) {
        const formData = new FormData();
        files.forEach((f) => formData.append('documents', f));
        await documentAPI.batchUpload(formData, (e) => {
          const pct = Math.round((e.loaded / e.total) * 100);
          files.forEach((_, i) => {
            setFileStatuses((p) => ({ ...p, [i]: { status: 'uploading', progress: pct } }));
          });
        });
        files.forEach((_, i) => setFileStatuses((p) => ({ ...p, [i]: { status: 'done' } })));
      } else {
        for (let i = 0; i < files.length; i++) {
          const formData = new FormData();
          formData.append('document', files[i]);
          setFileStatuses((p) => ({ ...p, [i]: { status: 'uploading', progress: 0 } }));
          try {
            await documentAPI.upload(formData, (e) => {
              const pct = Math.round((e.loaded / e.total) * 100);
              setFileStatuses((p) => ({ ...p, [i]: { status: 'uploading', progress: pct } }));
            });
            setFileStatuses((p) => ({ ...p, [i]: { status: 'done' } }));
          } catch {
            setFileStatuses((p) => ({ ...p, [i]: { status: 'error' } }));
          }
        }
      }

      toast.success(`${files.length} document(s) uploaded and queued for processing`);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setTimeout(() => {
        setFiles([]);
        setFileStatuses({});
        onSuccess?.();
      }, 1500);
    } catch (error) {
      toast.error(error?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {}
      <motion.div
        {...getRootProps()}
        animate={{
          borderColor: isDragActive ? '#38BDF8' : '#2A2A38',
          backgroundColor: isDragActive ? 'rgba(56,189,248,0.05)' : 'transparent',
        }}
        transition={{ duration: 0.15 }}
        className="border-2 border-dashed rounded-card p-10 text-center cursor-pointer transition-all"
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ scale: isDragActive ? 1.1 : 1 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center gap-3"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${isDragActive ? 'border-sky bg-sky-muted' : 'border-border bg-bg-elevated'}`}>
            <Upload className={`w-6 h-6 ${isDragActive ? 'text-sky' : 'text-text-tertiary'}`} />
          </div>
          <div>
            <p className="text-text-primary font-medium">
              {isDragActive ? 'Drop documents here' : 'Drag & drop documents'}
            </p>
            <p className="text-text-tertiary text-sm mt-1">
              or <span className="text-sky">browse files</span>
            </p>
          </div>
          <p className="text-text-tertiary text-xs">
            JPEG, PNG, TIFF, PDF — max 10MB {batch && '— up to 50 files'}
          </p>
        </motion.div>
      </motion.div>

      {}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {files.map((file, i) => (
              <div key={i} className="relative group">
                <FileItem
                  file={file}
                  status={fileStatuses[i]?.status || 'pending'}
                  progress={fileStatuses[i]?.progress || 0}
                />
                {!isUploading && !fileStatuses[i]?.status && (
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={uploadAll}
              disabled={isUploading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload {files.length} file{files.length > 1 ? 's' : ''}</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
