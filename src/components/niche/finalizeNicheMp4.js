// Repair out-of-range recorder clock origins without re-encoding any media.
// Blob slices keep the large mdat payload out of JS memory.
const boxes = (view, start = 0, end = view.byteLength) => {
  const result = [];
  while (start + 8 <= end) {
    let size = view.getUint32(start), header = 8;
    const type = String.fromCharCode(...new Uint8Array(view.buffer, start + 4, 4));
    if (size === 1) { if (start + 16 > end) break; size = Number(view.getBigUint64(start + 8)); header = 16; }
    if (!size) size = end - start;
    if (size < header || start + size > end) break;
    result.push({ type, start, end: start + size, data: start + header });
    start += size;
  }
  return result;
};
const readTime = (v, p, wide) => wide ? Number(v.getBigUint64(p)) : v.getUint32(p);
const writeTime = (v, p, wide, value) => {
  const n = Math.max(0, Math.round(value));
  if (wide) v.setBigUint64(p, BigInt(n)); else v.setUint32(p, Math.min(n, 0xffffffff));
};
const timedHeader = (v, b) => {
  const wide = v.getUint8(b.data) === 1;
  return { wide, scale: v.getUint32(b.data + (wide ? 20 : 12)), pos: b.data + (wide ? 24 : 16) };
};
export default async function finalizeNicheMp4(blob, seconds) {
  if (!blob.type.includes('mp4') || !(seconds > 0)) return blob;
  const parts = [], tracks = new Map(), fragments = [], indexes = [];
  let movieScale = 0;
  for (let offset = 0; offset + 8 <= blob.size;) {
    const header = new DataView(await blob.slice(offset, offset + 16).arrayBuffer());
    let size = header.getUint32(0);
    const type = String.fromCharCode(...new Uint8Array(header.buffer, 4, 4));
    if (size === 1) size = Number(header.getBigUint64(8));
    if (!size) size = blob.size - offset;
    if (size < 8 || offset + size > blob.size) throw new Error('The recorded MP4 is incomplete. Your build checkpoint is retained.');
    const slice = blob.slice(offset, offset + size);
    if (!['moov', 'moof', 'sidx', 'mfra'].includes(type)) parts.push(slice);
    else {
      const data = await slice.arrayBuffer(), v = new DataView(data), root = boxes(v)[0];
      if (!root) throw new Error('The recorded MP4 has invalid timing metadata.');
      parts.push(data);
      if (type === 'sidx' || type === 'mfra') {
        indexes.push({ v, root });
      } else if (type === 'moov') {
        const children = boxes(v, root.data, root.end);
        const mvex = children.find(b => b.type === 'mvex');
        const mehd = mvex && boxes(v, mvex.data, mvex.end).find(b => b.type === 'mehd');
        const mvhd = children.find(b => b.type === 'mvhd');
        if (mvhd) {
          const h = timedHeader(v, mvhd); movieScale = h.scale;
          const duration = readTime(v, h.pos, h.wide) / h.scale;
          if (!duration || duration > seconds + 60) writeTime(v, h.pos, h.wide, seconds * h.scale);
        }
        if (mehd && movieScale) {
          const wide = v.getUint8(mehd.data) === 1, p = mehd.data + 4;
          const duration = readTime(v, p, wide) / movieScale;
          if (!duration || duration > seconds + 60) writeTime(v, p, wide, seconds * movieScale);
        }
        for (const trak of children.filter(b => b.type === 'trak')) {
          const ts = boxes(v, trak.data, trak.end), tkhd = ts.find(b => b.type === 'tkhd');
          const mdia = ts.find(b => b.type === 'mdia');
          if (!tkhd || !mdia) continue;
          const wide = v.getUint8(tkhd.data) === 1;
          const id = v.getUint32(tkhd.data + (wide ? 20 : 12));
          const edts = ts.find(b => b.type === 'edts');
          const elst = edts && boxes(v, edts.data, edts.end).find(b => b.type === 'elst');
          if (elst && movieScale) {
            const ew = v.getUint8(elst.data) === 1, stride = ew ? 20 : 12;
            const count = v.getUint32(elst.data + 4);
            for (let i = 0, p = elst.data + 8; i < count && p + stride <= elst.end; i++, p += stride) {
              const duration = readTime(v, p, ew) / movieScale;
              const mediaTime = ew ? Number(v.getBigInt64(p + 8)) : v.getInt32(p + 4);
              if (duration > seconds + 60) writeTime(v, p, ew, mediaTime === -1 ? 0 : seconds * movieScale);
            }
          }
          const mdhd = boxes(v, mdia.data, mdia.end).find(b => b.type === 'mdhd');
          if (!mdhd) continue;
          const h = timedHeader(v, mdhd); tracks.set(id, h.scale);
          const tp = tkhd.data + (wide ? 28 : 20);
          for (const [p, w, scale] of [[tp, wide, movieScale], [h.pos, h.wide, h.scale]]) {
            const duration = readTime(v, p, w) / scale;
            if (scale && (!duration || duration > seconds + 60)) writeTime(v, p, w, seconds * scale);
          }
        }
      } else {
        for (const traf of boxes(v, root.data, root.end).filter(b => b.type === 'traf')) {
          const cs = boxes(v, traf.data, traf.end), tfhd = cs.find(b => b.type === 'tfhd'), tfdt = cs.find(b => b.type === 'tfdt');
          if (tfhd && tfdt) {
            const id = v.getUint32(tfhd.data + 4), wide = v.getUint8(tfdt.data) === 1, pos = tfdt.data + 4;
            fragments.push({ v, id, wide, pos, time: readTime(v, pos, wide) });
          }
        }
      }
    }
    offset += size;
  }
  const first = new Map();
  for (const f of fragments) if (!first.has(f.id) && tracks.get(f.id)) first.set(f.id, f.time / tracks.get(f.id));
  const origin = first.size ? Math.min(...first.values()) : 0;
  // Preserve the shared A/V offset; never reset each track independently.
  if (origin > seconds + 60) for (const f of fragments) {
    const scale = tracks.get(f.id);
    if (scale) writeTime(f.v, f.pos, f.wide, f.time - origin * scale);
  }
  if (origin > seconds + 60) for (const { v, root } of indexes) {
    if (root.type === 'sidx') {
      const wide = v.getUint8(root.data) === 1, scale = v.getUint32(root.data + 8), p = root.data + 12;
      writeTime(v, p, wide, readTime(v, p, wide) - origin * scale);
    } else for (const b of boxes(v, root.data, root.end).filter(b => b.type === 'tfra')) {
      const wide = v.getUint8(b.data) === 1, scale = tracks.get(v.getUint32(b.data + 4));
      if (!scale) continue;
      const sizes = v.getUint32(b.data + 8), count = v.getUint32(b.data + 12);
      const stride = (wide ? 16 : 8) + ((sizes >> 4 & 3) + 1) + ((sizes >> 2 & 3) + 1) + ((sizes & 3) + 1);
      for (let i = 0, p = b.data + 16; i < count && p + stride <= b.end; i++, p += stride)
        writeTime(v, p, wide, readTime(v, p, wide) - origin * scale);
    }
  }
  return new Blob(parts, { type: blob.type });
}