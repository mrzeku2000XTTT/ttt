import { useState } from "react";
import { ExternalLink } from "lucide-react";

export default function Farlands() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/869680b72_IMG_0177.jpeg"
            alt="Farlands"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="text-white font-bold text-lg">Farlands</span>
        </div>
        <a
          href="https://farlands.world"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Open
        </a>
      </div>

      {/* iframe or fallback */}
      {failed ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/869680b72_IMG_0177.jpeg"
            alt="Farlands"
            className="w-24 h-24 rounded-2xl object-cover shadow-lg"
          />
          <div>
            <h2 className="text-white text-2xl font-bold mb-2">Farlands</h2>
            <p className="text-white/50 text-sm mb-6">
              This site can't be embedded directly.<br />Tap below to open it in your browser.
            </p>
            <a
              href="https://farlands.world"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl text-base"
            >
              <ExternalLink className="w-5 h-5" />
              Open Farlands
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src="https://farlands.world"
          className="flex-1 w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera"
          allowFullScreen
          title="Farlands"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}