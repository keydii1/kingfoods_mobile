let listeners = new Set();

export function subscribeOrdersRefresh(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyOrdersRefresh() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}
