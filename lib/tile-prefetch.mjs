export function createTilePrefetcher(fetcher = globalThis.fetch) {
  const completed = new Set();
  const running = new Map();
  let queue = [];
  let desired = new Set();
  let disposed = false;
  function drain() {
    while (!disposed && running.size < 4 && queue.length) {
      const url = queue.shift();
      if (completed.has(url) || running.has(url)) continue;
      const controller = new AbortController();
      running.set(url, controller);
      const timeout = setTimeout(() => controller.abort(), 5000);
      Promise.resolve().then(() => fetcher(url, {
        cache: "force-cache", mode: "cors", signal: controller.signal,
      })).then((response) => {
        if (!response.ok) throw new Error("Tile request failed");
        return response.arrayBuffer();
      }).then(() => {
        if (controller.signal.aborted) return;
        completed.add(url);
        if (completed.size > 1600) completed.delete(completed.values().next().value);
      }).catch(() => {}).finally(() => {
        clearTimeout(timeout);
        running.delete(url);
        drain();
      });
    }
  }
  return {
    update(urls) {
      if (disposed) return;
      desired = new Set(urls.slice(0, 128));
      queue = [...desired].filter((url) => !completed.has(url) && !running.has(url));
      for (const [url, controller] of running) if (!desired.has(url)) controller.abort();
      drain();
    },
    dispose() {
      disposed = true;
      queue = [];
      for (const controller of running.values()) controller.abort();
    },
  };
}

