import nicheMobileAssets from '@/components/niche/nicheMobileAssets';

// Current scene plus two upcoming scenes; all use the original generated URLs.
export default function nicheMobileSceneQueue(scenes, ac, token) {
  const ready = new Map(), pending = new Map();
  let disposed = false, error = null;
  const assetToken = { get cancelled() { return disposed || token?.cancelled; } };
  const load = (index) => {
    if (index >= scenes.length || disposed) return Promise.resolve();
    if (ready.has(index)) return Promise.resolve(ready.get(index));
    if (pending.has(index)) return pending.get(index);
    const promise = nicheMobileAssets(scenes[index], ac, assetToken).then(assets => {
      if (disposed) { assets.release(); return; }
      ready.set(index, assets);
      return assets;
    }).catch(cause => { if (!disposed) error = cause; throw cause; });
    promise.catch(() => {});
    pending.set(index, promise);
    return promise;
  };
  return {
    load,
    get(index) {
      if (error) throw error;
      const assets = ready.get(index);
      if (!assets) throw new Error('The next scene did not load in time. Resume the build rather than saving an incomplete video.');
      return assets;
    },
    release(index) { ready.get(index)?.release(); ready.delete(index); pending.delete(index); },
    dispose() {
      disposed = true;
      ready.forEach(assets => assets.release()); ready.clear(); pending.clear();
    }
  };
}