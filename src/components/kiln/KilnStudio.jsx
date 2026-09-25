import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Home, Store, Upload } from 'lucide-react';
import KilnChat from './KilnChat';
import KilnPixelSteps from './KilnPixelSteps';
import KilnPreview from './KilnPreview';
import KilnFullscreen from './KilnFullscreen';
import KilnComponentRail from './KilnComponentRail';
import { KILN_LOGO } from './kilnAssets';
import './kiln.css';

const DEFAULTS = { width: 1440, height: 900 };

export default function KilnStudio({ onHome, initialFile }) {
  const fileInput = useRef(null);
  const seeded = useRef(false);

  const [source, setSource] = useState(null);
  const [html, setHtml] = useState('');
  const [eta, setEta] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const width = source?.width || DEFAULTS.width;
  const height = source?.height || DEFAULTS.height;

  useEffect(() => {
    if (!busy) {
      setStage(0);
      return undefined;
    }
    setElapsed(0);
    const clock = setInterval(() => setElapsed((value) => value + 1), 1000);
    const walk = setInterval(() => setStage((value) => Math.min(value + 1, 3)), 3400);
    return () => {
      clearInterval(clock);
      clearInterval(walk);
    };
  }, [busy]);

  const push = (message) => setMessages((list) => [...list, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...message }]);

  const applyResult = (data) => {
    setHtml(data.html);
    setEta(data.etaComponents || []);
    if (data.imageWidth) setSource((current) => (current ? { ...current, width: data.imageWidth, height: data.imageHeight || current.height } : current));
    push({
      role: 'agent',
      text: data.reply || 'Built the component sheet and marked every block with its ETA component.',
      eta: data.etaComponents || [],
      sections: data.sections || [],
    });
    setTab('preview');
  };

  const runAgent = async (payload) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('kilnAgent', payload);
      const data = response?.data;
      if (data?.html) {
        applyResult(data);
      } else {
        push({ role: 'agent', text: data?.error || 'That build did not come back complete. Try again.' });
      }
    } catch (error) {
      push({ role: 'agent', text: error?.response?.data?.error || 'That build failed. Please try again.' });
    }
    setBusy(false);
  };

  const loadFile = async (file) => {
    if (!file || busy) return;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      push({ role: 'user', text: file.name || 'Pasted image', image: dataUrl });
      setSource({ url: null, dataUrl, width: image.naturalWidth, height: image.naturalHeight, name: file.name });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 86400 });
      setSource({ url: signed_url, dataUrl, width: image.naturalWidth, height: image.naturalHeight, name: file.name });
      await runAgent({
        mode: 'clone',
        imageUrl: signed_url,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
      });
    } catch (error) {
      push({ role: 'agent', text: 'That image could not be read. Try another file.' });
    }
  };

  const loadLink = async (url) => {
    const size = await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth || DEFAULTS.width, height: image.naturalHeight || DEFAULTS.height });
      image.onerror = () => resolve({ width: DEFAULTS.width, height: DEFAULTS.height });
      image.src = url;
    });
    push({ role: 'user', text: url, image: url });
    setSource({ url, dataUrl: url, width: size.width, height: size.height, name: url });
    await runAgent({ mode: 'clone', imageUrl: url, imageWidth: size.width, imageHeight: size.height });
  };

  useEffect(() => {
    if (initialFile && !seeded.current) {
      seeded.current = true;
      loadFile(initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    if (!html) {
      if (/^https?:\/\//i.test(text)) {
        await loadLink(text);
      } else {
        push({ role: 'user', text });
        push({ role: 'agent', text: 'I need the picture first — drop the image, paste a screenshot, or paste an image link.' });
      }
      return;
    }
    push({ role: 'user', text });
    await runAgent({
      mode: 'edit',
      currentHtml: html,
      instruction: text,
      imageUrl: source?.url || undefined,
      imageWidth: width,
      imageHeight: height,
    });
  };

  const instruct = (brief) => setDraft(brief);

  const portableHtml = source?.url && source?.dataUrl
    ? html.replaceAll(source.url.replaceAll('&', '&amp;'), source.dataUrl).replaceAll(source.url, source.dataUrl)
    : html;

  const copy = async () => {
    await navigator.clipboard.writeText(portableHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([portableHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kiln-components.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="kiln-page flex min-h-screen flex-col lg:h-screen">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          loadFile(file);
        }}
      />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] px-4 py-2.5">
        <button onClick={onHome} className="flex items-center gap-2" title="Back to the landing">
          <img src={KILN_LOGO} alt="KILN" className="h-7 w-7 rounded-[7px]" />
          <span className="kiln-display text-[17px] leading-none">KILN</span>
        </button>
        <span className="kiln-mono hidden text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--k-muted))] sm:block">
          image → ETA components
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={onHome} className="kiln-btn px-3 py-1.5">
            <Home className="h-3.5 w-3.5" />
            Home
          </button>
          <button onClick={() => { window.location.href = '/AppStoreV2'; }} className="kiln-btn px-3 py-1.5">
            <Store className="h-3.5 w-3.5" />
            Store
          </button>
        </div>
      </header>

      <main
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = Array.from(event.dataTransfer?.files || []).find((entry) => entry.type.startsWith('image/'));
          if (file) loadFile(file);
        }}
        className="mx-auto grid w-full max-w-[1560px] flex-1 gap-3 px-3 pb-4 pt-3 lg:min-h-0 lg:grid-cols-[352px_minmax(0,1fr)_228px] lg:overflow-hidden"
      >
        <div className="h-[560px] min-h-0 lg:h-auto">
          <KilnChat
            messages={messages}
            busy={busy}
            stage={stage}
            elapsed={elapsed}
            draft={draft}
            setDraft={setDraft}
            onSend={send}
            onPickFile={() => fileInput.current?.click()}
            onPasteImage={loadFile}
            hasSource={!!html}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <KilnPixelSteps stage={stage} busy={busy} elapsed={elapsed} />
          {html ? (
            <KilnPreview
              html={html}
              width={width}
              height={height}
              tab={tab}
              onTab={setTab}
              onCopy={copy}
              copied={copied}
              onDownload={download}
              onFullscreen={() => setFullscreen(true)}
            />
          ) : (
            <button
              onClick={() => fileInput.current?.click()}
              className="kiln-pixel flex min-h-[280px] flex-1 flex-col items-center justify-center gap-2 border border-dashed border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] px-6 text-center"
            >
              <Upload className="h-5 w-5 text-[hsl(var(--k-amber))]" />
              <span className="kiln-display text-[15px]">Drop the image you made</span>
              <span className="max-w-[300px] text-[11.5px] leading-5 text-[hsl(var(--k-muted))]">
                A screenshot, a mock, a component sheet — KILN rebuilds it as working HTML and marks every block with its ETA component.
              </span>
            </button>
          )}
        </div>

        <div className="max-h-[360px] min-h-0 lg:max-h-none">
          <KilnComponentRail used={eta} onInstruct={instruct} />
        </div>
      </main>

      {fullscreen && html && (
        <KilnFullscreen
          html={html}
          width={width}
          height={height}
          onClose={() => setFullscreen(false)}
          onCopy={copy}
          copied={copied}
          onDownload={download}
        />
      )}
    </div>
  );
}