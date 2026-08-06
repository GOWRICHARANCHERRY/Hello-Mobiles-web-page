const store = new Map();

export function cached(key, ttlMs, loader) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.value);
  return Promise.resolve()
    .then(loader)
    .then((value) => {
      store.set(key, { ts: Date.now(), value });
      return value;
    })
    .catch((err) => {
      if (hit) return hit.value;
      throw err;
    });
}

export function invalidateCache(prefix) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
