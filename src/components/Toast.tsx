import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border bg-white border-amber-200 text-[#111827] transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
            role="alert"
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#FDD023]" />}
            </div>
            <div className="flex-1">
              <h4 className="font-heading font-black text-sm text-[#111827]">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              id={`toast-dismiss-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
