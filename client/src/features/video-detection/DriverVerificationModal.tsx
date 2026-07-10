import { useEffect, useState } from 'react';
import {
  X, Check, ScanText, Sparkles, ShieldCheck, ShieldAlert,
  PartyPopper, Mail, MailWarning, IdCard, UserCheck, CreditCard,
} from 'lucide-react';
import type { VerificationResult } from '@/shared/types';

interface Props {
  plate: string;
  loading: boolean;
  result: VerificationResult | null;
  onClose: () => void;
}

// ── Loading: a real step-by-step progress checklist, not just a spinner ──────
const LOADING_STEPS = [
  { icon: ScanText,    label: 'Reading driver license', sub: 'Extracting text from the photo' },
  { icon: Sparkles,    label: 'Verifying Driver Details', sub: 'Cross-reading the license photo itself' },
  { icon: ShieldCheck, label: 'Checking vehicle registry', sub: 'Matching against registered driver record' },
];

function LoadingStep({ icon: Icon, label, sub, state }: {
  icon: typeof ScanText; label: string; sub: string; state: 'done' | 'active' | 'pending';
}) {
  return (
    <div className={`flex items-center gap-3 transition-opacity duration-300 ${state === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
      <div className={`relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${
        state === 'done' ? 'bg-emerald-500' : state === 'active' ? 'bg-sky-500' : 'bg-slate-200'
      }`}>
        {state === 'done'
          ? <Check className="w-4.5 h-4.5 text-white" strokeWidth={3} />
          : <Icon className={`w-4 h-4 ${state === 'active' ? 'text-white' : 'text-slate-400'}`} />}
        {state === 'active' && (
          <span className="absolute inset-0 rounded-full border-2 border-sky-300 animate-ping" />
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold ${state === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>{label}</p>
        <p className="text-slate-400 text-[11px]">{sub}</p>
      </div>
    </div>
  );
}

// ── Result: numbered checklist rows that morph into check/cross ──────────────
function ChecklistRow({ n, ok, icon: Icon, label, expected, found, delayMs }: {
  n: number; ok: boolean; icon: typeof IdCard; label: string;
  expected?: string | null; found?: string | null; delayMs: number;
}) {
  return (
    <div className="flex items-center gap-3 py-3 animate-slide-up" style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'backwards' }}>
      <div className={`relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-100' : 'bg-red-100'}`}>
        <Icon className={`w-4 h-4 ${ok ? 'text-emerald-600' : 'text-red-600'}`} />
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {ok ? <Check className="w-3 h-3" strokeWidth={3} /> : n}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${ok ? 'text-slate-800' : 'text-red-700'}`}>{label}</p>
        {ok ? (
          <p className="text-slate-500 text-xs truncate">{found}</p>
        ) : (
          <p className="text-red-500 text-xs truncate">Expected <strong>{expected || '—'}</strong>, found <strong>{found || 'unreadable'}</strong></p>
        )}
      </div>
    </div>
  );
}

export function DriverVerificationModal({ plate, loading, result, onClose }: Props) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setStepIdx(0);
    const id = setInterval(() => setStepIdx(i => Math.min(i + 1, LOADING_STEPS.length - 1)), 1100);
    return () => clearInterval(id);
  }, [loading]);

  const isMatch = result?.match ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={loading ? undefined : onClose}>
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>

        {loading ? (
          <>
            <div className="px-6 pt-7 pb-6 bg-gradient-to-br from-sky-500 to-sky-600 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-3">
                <ScanText className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-bold text-base">Verifying Vehicle</p>
              <p className="text-sky-100 text-xs mt-0.5">{plate}</p>
            </div>
            <div className="flex flex-col gap-4 px-6 py-6">
              {LOADING_STEPS.map((step, i) => (
                <LoadingStep key={step.label} {...step} state={i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending'} />
              ))}
            </div>
          </>
        ) : result && (
          <>
            <button onClick={onClose}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className={`px-6 pt-7 pb-6 text-center bg-gradient-to-br ${isMatch ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'}`}>
              <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-3 animate-slide-up" style={{ animationFillMode: 'backwards' }}>
                {isMatch ? <ShieldCheck className="w-7 h-7 text-white" /> : <ShieldAlert className="w-7 h-7 text-white" />}
              </div>
              <p className="text-white font-bold text-base">{isMatch ? 'Vehicle Verified' : 'Suspicious — Please Check'}</p>
              <p className={`text-xs mt-0.5 ${isMatch ? 'text-emerald-100' : 'text-red-100'}`}>{plate}</p>
            </div>

            <div className="px-6 py-2">
              <div className="divide-y divide-slate-100">
                <ChecklistRow n={1} ok={result.plateRegistered} icon={CreditCard} label="Vehicle Number Plate"
                  found={plate} delayMs={0} />
                <ChecklistRow n={2} ok={result.driverIdMatch} icon={IdCard} label="Driver ID"
                  expected={result.driverId} found={result.extractedDriverId} delayMs={120} />
                <ChecklistRow n={3} ok={result.driverNameMatch} icon={UserCheck} label="Driver Name"
                  expected={result.driverName} found={result.extractedDriverName} delayMs={240} />
              </div>
            </div>

            <div className="px-6 pb-3">
              {isMatch ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-slide-up"
                  style={{ animationDelay: '380ms', animationFillMode: 'backwards' }}>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-emerald-800 text-sm leading-snug"><strong>{result.goods}</strong> have arrived at our industry!</p>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-slide-up"
                  style={{ animationDelay: '380ms', animationFillMode: 'backwards' }}>
                  <p className="text-red-700 text-sm leading-snug">{result.reason || 'Vehicle details could not be verified.'}</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-2 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                result.emailSent ? 'bg-slate-50 text-slate-600' : 'bg-amber-50 text-amber-700'
              }`}>
                {result.emailSent
                  ? <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  : <MailWarning className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                {result.emailSent ? 'Supervisor notified by email' : 'Notification email failed to send'}
              </div>
            </div>

            <div className="px-6 pt-2 pb-6">
              <button onClick={onClose}
                className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] transition-all shadow-md shadow-sky-200">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
