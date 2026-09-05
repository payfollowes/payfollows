import React, { useCallback, useRef, useState } from 'react';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  workingLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * In-app confirmation dialog styled to match the admin panels.
 *
 * Use it directly when you need busy-state handling (see UserManagement.tsx, which keeps
 * the dialog open and shows a "working..." label while the action runs), or use
 * useConfirmDialog() below for a simple promise-based window.confirm replacement.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  workingLabel,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-container border border-brand-border rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-sm text-gray-300 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-brand-border rounded-lg hover:bg-black/20"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading && workingLabel ? workingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ConfirmDialogRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * Promise-based window.confirm replacement:
 *
 *   const { confirmDialog, confirmAsync } = useConfirmDialog();
 *   const ok = await confirmAsync({ title: 'Delete', message: 'Are you sure?', danger: true });
 *   if (!ok) return;
 *   // ...do the destructive work...
 *
 * Render {confirmDialog} once anywhere in the component's JSX; it renders nothing
 * while no confirmation is pending.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmDialogRequest | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const confirmAsync = useCallback((req: ConfirmDialogRequest) => {
    setRequest(req);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    setRequest(null);
    resolverRef.current?.(ok);
    resolverRef.current = null;
  }, []);

  const confirmDialog = request ? (
    <ConfirmDialog
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      danger={request.danger}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { confirmDialog, confirmAsync };
}