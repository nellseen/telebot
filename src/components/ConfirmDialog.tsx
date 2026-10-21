import { AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isDestructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 text-base">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-xl transition-colors shadow-lg ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
            } disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
