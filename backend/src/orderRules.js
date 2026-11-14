// Shared fulfillment policy: only pending/confirmed orders may be cancelled.
export const STATUS_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['confirmed', 'cancelled']),
  confirmed: Object.freeze(['shipped', 'cancelled']),
  shipped: Object.freeze(['delivered']),
  delivered: Object.freeze([]),
  cancelled: Object.freeze([]),
});
export function canTransition(currentStatus, nextStatus) {
  return Object.prototype.hasOwnProperty.call(STATUS_TRANSITIONS, currentStatus)
    && STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}
export function validCheckoutItems(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 40) return false;
  const ids = new Set();
  for (const item of raw) {
    const id = Number(item?.product_id);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(item?.quantity)
      || item.quantity < 1 || item.quantity > 10000 || ids.has(id)) return false;
    ids.add(id);
  }
  return true;
}
