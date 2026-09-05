/** Shared helpers for displaying order delivery estimates. */

/** "57 minutes"-style verbatim labels win; otherwise format hours like the rest of the app. */
export const formatHoursLabel = (hours: number | null | undefined): string | null => {
  if (hours === null || hours === undefined || !Number.isFinite(hours) || hours <= 0) {
    return null;
  }
  const h = Math.max(1, Math.ceil(hours));
  if (h >= 24 && h % 24 === 0) return `${h / 24} day${h / 24 === 1 ? '' : 's'}`;
  return `${h} hour${h === 1 ? '' : 's'}`;
};

/** Compact duration like "~12m", "~2h 5m". */
export const formatDurationShort = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms < 60000) return 'under a minute';
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  if (totalMinutes < 60) return `~${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `~${hours}h ${minutes}m` : `~${hours}h`;
};

export interface OrderEtaInput {
  status?: string | null;
  quantity?: number | null;
  remains?: number | null;
  createdAt?: string | null;
  now?: number;
}

/**
 * Live ETA derived from order progress. The provider reports `remains`, so
 * progress = (quantity - remains) / quantity. Assuming delivery proceeds at a
 * roughly constant rate since the order was created, the projected total time
 * is elapsed / progress, and the ETA is what's left of that projection.
 * Returns null when there is no progress data yet (order still pending).
 */
export const computeOrderEtaMs = (input: OrderEtaInput): number | null => {
  const status = String(input.status || '').toLowerCase();
  if (['completed', 'canceled', 'failed'].includes(status)) return null;

  const quantity = Number(input.quantity) || 0;
  const remains =
    input.remains === null || input.remains === undefined
      ? null
      : Number(input.remains);
  if (!quantity || remains === null || remains < 0) return null;

  const delivered = Math.max(quantity - remains, 0);
  if (delivered <= 0) return null; // not started yet

  const createdAt = input.createdAt ? new Date(input.createdAt).getTime() : 0;
  if (!createdAt) return null;

  const now = input.now ?? Date.now();
  const elapsedMs = Math.max(now - createdAt, 0);
  if (elapsedMs <= 0) return null;

  const progress = Math.min(Math.max(delivered / quantity, 0.001), 1);
  const projectedTotalMs = elapsedMs / progress;
  return Math.max(projectedTotalMs - elapsedMs, 0);
};

export const formatOrderEta = (input: OrderEtaInput): string | null => {
  const etaMs = computeOrderEtaMs(input);
  if (etaMs === null) return null;
  return formatDurationShort(etaMs);
};