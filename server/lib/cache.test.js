import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CacheStore from './cache.js';

/**
 * Create a promise whose resolution we control externally, so a test can
 * hold a fetch "in-flight" across an invalidation.
 */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('CacheStore generation guard', () => {
  beforeEach(() => {
    // Keep the cache's [Cache] log lines out of the test output.
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves the happy path: a miss fetches once and later gets hit from cache', async () => {
    const cache = new CacheStore(10 * 60 * 1000, 8000);
    const fetcher = vi.fn().mockResolvedValue('value');

    expect(await cache.get('key', fetcher)).toBe('value');
    expect(await cache.get('key', fetcher)).toBe('value');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not repopulate the cache with a stale snapshot when the entry is invalidated mid-fetch', async () => {
    const cache = new CacheStore(10 * 60 * 1000, 8000);
    const slow = deferred();
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => slow.promise)
      .mockResolvedValueOnce('fresh');

    // This is the observed production race: a list fetch starts, a write
    // invalidates the cache while it is in-flight, then the fetch resolves
    // with the pre-invalidation snapshot.
    const first = cache.get('key', fetcher);
    await Promise.resolve(); // let the fetch start and hang in-flight

    cache.invalidate('key'); // the write that must win over the stale snapshot

    slow.resolve('stale');
    expect(await first).toBe('stale'); // the in-flight caller still gets its result

    // The stale snapshot must NOT have been cached — this get refetches.
    expect(await cache.get('key', fetcher)).toBe('fresh');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not deduplicate a post-invalidation caller onto the stale in-flight fetch', async () => {
    const cache = new CacheStore(10 * 60 * 1000, 8000);
    const slow = deferred();
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => slow.promise)
      .mockResolvedValueOnce('fresh');

    const first = cache.get('key', fetcher); // miss -> new in-flight fetch (generation 0)
    await Promise.resolve();
    const second = cache.get('key', fetcher); // same generation -> joins the first fetch
    expect(fetcher).toHaveBeenCalledTimes(1); // deduped, no second fetch yet

    cache.invalidate('key'); // generation bumps to 1

    // A caller arriving after the invalidation must NOT join the stale
    // generation-0 fetch; it starts a fresh one immediately.
    const third = cache.get('key', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);

    slow.resolve('stale');
    expect(await first).toBe('stale');
    expect(await second).toBe('stale');
    expect(await third).toBe('fresh');

    // The fresh result landed in the cache under the current generation.
    expect(await cache.get('key', fetcher)).toBe('fresh');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});