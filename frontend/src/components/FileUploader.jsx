import { useState, useRef, useCallback } from 'react';
import { uploadLogFile } from '../services/api';

export default function FileUploader({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const allowedTypes = ['.log', '.txt'];

  const validateFile = (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      setErrorMsg('Invalid file type. Only .log and .txt files are allowed.');
      setStatus('error');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleUpload = useCallback(async (selectedFile) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    setStatus('uploading');
    setProgress(0);

    try {
      const res = await uploadLogFile(selectedFile, (pct) => setProgress(pct));
      setStatus('success');
      setProgress(100);
      if (onUploadComplete) onUploadComplete(res.data);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err?.response?.data?.error || 'Upload failed. Please try again.');
    }
  }, [onUploadComplete]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleUpload(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleUpload(selectedFile);
  };

  const reset = () => {
    setFile(null);
    setProgress(0);
    setStatus('idle');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="glass p-6 animate-slideUp" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>📁</span> Upload Log File
      </h3>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => status !== 'uploading' && fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/[0.06] shadow-[0_0_30px_rgba(6,182,212,0.15)]'
            : status === 'success'
            ? 'border-emerald-500/50 bg-emerald-500/[0.04]'
            : status === 'error'
            ? 'border-rose-500/50 bg-rose-500/[0.04]'
            : 'border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".log,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {status === 'idle' && (
          <div className="space-y-3">
            <div className="text-4xl">☁️</div>
            <p className="text-slate-300 font-medium">
              Drag & drop your log file here
            </p>
            <p className="text-slate-500 text-sm">
              or <span className="text-cyan-400 underline underline-offset-2">browse</span> to select — .log or .txt only
            </p>
          </div>
        )}

        {status === 'uploading' && (
          <div className="space-y-4">
            <div className="text-3xl animate-pulse">⬆️</div>
            <p className="text-slate-300 font-medium">Uploading {file?.name}...</p>
            {/* Progress Bar */}
            <div className="max-w-xs mx-auto">
              <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: 'var(--gradient-primary)',
                  }}
                />
              </div>
              <p className="text-cyan-400 text-sm font-medium mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-emerald-400 font-medium">Upload Successful!</p>
            <p className="text-slate-400 text-sm">{file?.name}</p>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
            >
              Upload Another
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="text-4xl">❌</div>
            <p className="text-rose-400 font-medium">Upload Failed</p>
            <p className="text-slate-400 text-sm">{errorMsg}</p>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
