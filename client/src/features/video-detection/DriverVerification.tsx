import { useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { VerificationResult } from '@/shared/types';
import { DriverVerificationModal } from './DriverVerificationModal';

interface Props { plate: string; inTime?: string; }

export function DriverVerification({ plate, inTime }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<VerificationResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setModalOpen(true);
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('plate', plate);
      form.append('in_time', inTime ?? '');
      form.append('license_photo', file);
      const r = await fetch('/api/verify-driver', { method: 'POST', body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Verification failed');
      setResult(d);
    } catch (e) {
      setModalOpen(false);
      setError(e instanceof Error ? e.message : 'Verification failed — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {modalOpen && (
        <DriverVerificationModal plate={plate} loading={loading} result={result} onClose={() => setModalOpen(false)} />
      )}

      {result ? (
        <button onClick={() => setModalOpen(true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
            result.match
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
              : 'bg-red-50 hover:bg-red-100 text-red-700'
          }`}>
          {result.match ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {result.match ? 'Verified' : 'Suspicious'}
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-slate-400 text-[10px] leading-snug">
            Upload the driver license for this vehicle
          </p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }} />
          <button onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 text-[11px] font-semibold transition-colors whitespace-nowrap w-fit">
            <Upload className="w-3 h-3" />Upload License — {plate}
          </button>
          {error && <p className="text-red-500 text-[10px] mt-1 max-w-[180px]">{error}</p>}
        </div>
      )}
    </>
  );
}
