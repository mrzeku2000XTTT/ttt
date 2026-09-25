import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import LumiflyStage from './LumiflyStage';
import { defaultProject } from './lumiflyPresets';

const PHRASES = ['Make It Happen.', 'Say It With Motion.', 'Words That Move.', 'Type It. Animate It.'];

/** The hero: the headline types itself, and the input hands its phrase to the studio. */
export default function LumiflyHero() {
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const [phrase, setPhrase] = useState('Make It Happen.');
  const demo = useMemo(() => defaultProject().scenes[0], []);

  useEffect(() => {
    let index = 0;
    let char = 0;
    let deleting = false;
    let timer;

    const step = () => {
      const phraseText = PHRASES[index];
      if (!deleting) {
        char += 1;
        setTyped(phraseText.slice(0, char));
        if (char >= phraseText.length) {
          deleting = true;
          timer = setTimeout(step, 1500);
          return;
        }
        timer = setTimeout(step, 62);
      } else {
        char -= 1;
        setTyped(phraseText.slice(0, char));
        if (char <= 0) {
          deleting = false;
          index = (index + 1) % PHRASES.length;
          timer = setTimeout(step, 320);
          return;
        }
        timer = setTimeout(step, 30);
      }
    };

    timer = setTimeout(step, 350);
    return () => clearTimeout(timer);
  }, []);

  const open = () => {
    const value = (phrase || 'Make It Happen.').trim();
    navigate(`/LumiflyStudio?text=${encodeURIComponent(value)}`);
  };

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ECECEC] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#666666]">
          <Sparkles className="w-3 h-3" />
          Motion type studio
        </span>

        <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-black sm:text-5xl">
          Type that moves,
          <span className="mt-1 block bg-gradient-to-r from-[#0000FF] to-[#A020F0] bg-clip-text text-transparent">
            {typed}
            <span className="font-light text-[#0000FF]">|</span>
          </span>
        </h1>

        <p className="mt-4 max-w-md text-[13px] leading-relaxed text-[#666666]">
          Animate text over animated gradient backdrops, scene by scene — every easing, slide offset, glow and match
          cut under your control.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') open();
            }}
            placeholder="Type the words you want animated"
            className="flex-1 rounded-full border border-[#ECECEC] px-4 py-3 text-[13px] text-black outline-none transition-colors focus:border-[#0000FF]"
          />
          <button
            onClick={open}
            className="flex items-center justify-center gap-1.5 rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Make It Happen
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="mt-3 text-[11px] text-[#999999]">
          Renders locally in your browser — your words never leave this device.
        </p>
      </div>

      <div className="rounded-2xl border border-[#ECECEC] p-2">
        <LumiflyStage scene={demo} aspect="16:9" selfPlay className="h-auto w-full rounded-xl" />
        <p className="px-1 pt-2 text-[10px] text-[#999999]">Live output · the studio's own renderer</p>
      </div>
    </section>
  );
}