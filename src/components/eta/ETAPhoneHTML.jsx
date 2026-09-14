import React, { useLayoutEffect, useRef } from 'react';

const REVEAL_CSS = Array.from({ length: 6 }, (_, index) => {
  const step = index + 1;
  const start = (0.04 + index * 0.1).toFixed(2);
  return `[data-eta-step="${step}"]{opacity:clamp(0,calc((var(--eta-progress) - ${start}) * 8),1);transform:translateY(calc((1 - clamp(0,calc((var(--eta-progress) - ${start}) * 8),1)) * 22px));}`;
}).join('');

function safeDocument(source) {
  const doc = new DOMParser().parseFromString(String(source || ''), 'text/html');
  doc.querySelectorAll('script,iframe,object,embed,link,meta').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => [...node.attributes].forEach((attr) => {
    if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
  }));
  const css = [...doc.querySelectorAll('style')].map((node) => node.textContent).join('\n').replace(/@import[^;]+;/gi, '').replace(/\bbody\b/g, '.eta-phone-ui').replace(/\bhtml\b/g, ':host');
  doc.querySelectorAll('style').forEach((node) => node.remove());
  return { css, body: doc.body.innerHTML };
}

export default function ETAPhoneHTML({ html, frameProgress = 1 }) {
  const hostRef = useRef(null);
  useLayoutEffect(() => {
    if (!hostRef.current) return;
    const root = hostRef.current.shadowRoot || hostRef.current.attachShadow({ mode: 'open' });
    const { css, body } = safeDocument(html);
    root.innerHTML = `<style>:host{display:block;width:100%;height:100%;overflow:hidden;background:#000;color:#fff}.eta-phone-ui{width:100%;height:100%;overflow:hidden;box-sizing:border-box}.eta-phone-ui *{box-sizing:border-box}${REVEAL_CSS}</style><style>${css}</style><div class="eta-phone-ui">${body}</div>`;
  }, [html]);
  useLayoutEffect(() => { hostRef.current?.style.setProperty('--eta-progress', String(Math.max(0, Math.min(1, frameProgress)))); }, [frameProgress]);
  return <div ref={hostRef} className="absolute inset-0" />;
}