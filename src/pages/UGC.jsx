import React from 'react';
import BackToStore from '@/components/BackToStore';
import UgcCharacters from '@/components/ugc/UgcCharacters';
import UgcConverter from '@/components/ugc/UgcConverter';

export default function UGC() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <BackToStore />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <header className="text-center mb-10">
          <span className="inline-flex items-center rounded-full bg-neutral-900 text-white text-xs font-semibold px-3 py-1 tracking-wide uppercase">
            UGC Factory
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-neutral-900">
            Any HTML becomes a prompt.
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-base text-neutral-500">
            The UGC Factory Girls take any HTML — a snippet or a full page — and engineer it into one clean,
            self-contained prompt you can use to recreate, animate, or turn it into video.
          </p>
        </header>

        {/* Girls */}
        <section className="mb-10">
          <UgcCharacters />
        </section>

        {/* Converter */}
        <section className="mb-12">
          <UgcConverter />
        </section>

        {/* Pipeline tie-in */}
        <section className="rounded-3xl bg-white ring-1 ring-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-neutral-900">The factory line</h2>
          <ol className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <li className="rounded-2xl bg-neutral-50 ring-1 ring-neutral-200 p-4">
              <span className="text-xs font-semibold text-neutral-400">01</span>
              <p className="mt-1 font-semibold text-neutral-900">Paste HTML</p>
              <p className="text-neutral-500">Any markup — landing page, email, component, full site.</p>
            </li>
            <li className="rounded-2xl bg-neutral-50 ring-1 ring-neutral-200 p-4">
              <span className="text-xs font-semibold text-neutral-400">02</span>
              <p className="mt-1 font-semibold text-neutral-900">Pick a mode</p>
              <p className="text-neutral-500">Recreate the layout, animate it, or write a promo video script.</p>
            </li>
            <li className="rounded-2xl bg-neutral-50 ring-1 ring-neutral-200 p-4">
              <span className="text-xs font-semibold text-neutral-400">03</span>
              <p className="mt-1 font-semibold text-neutral-900">Use the prompt</p>
              <p className="text-neutral-500">Copy it into any builder, animator, or video tool in the store.</p>
            </li>
          </ol>
        </section>

        <p className="mt-8 text-center text-xs text-neutral-400">
          Powered by the TTT prompt-skill library · Built for Kaspa
        </p>
      </div>
    </div>
  );
}