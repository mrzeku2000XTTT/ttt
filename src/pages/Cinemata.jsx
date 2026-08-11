import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CinekasOnboarding from "@/components/cinekas/CinekasOnboarding";

function CinekasLogo({ size = 40 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const G = '#00f5a0', B = '#00b4ff', W = 'rgba(255,255,255,0.9)';
    let animId;
    function draw(t) {
      ctx.clearRect(0, 0, 120, 120);
      const cx = 60, cy = 60, R = 22;
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.8 + i / 3) * Math.PI * 2;
        const ox = Math.cos(phase) * 9, oy = Math.sin(phase) * 9;
        const a0 = i * Math.PI * 2 / 3 + t * 0.4;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = a0 + k * Math.PI * 2 / 3;
          const px = cx + ox + Math.cos(a) * R, py = cy + oy + Math.sin(a) * R;
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        const alpha = 0.6 + 0.25 * Math.sin(t * 1.5 + i);
        ctx.strokeStyle = i === 0 ? G : i === 1 ? B : W;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.13;
        ctx.fillStyle = i === 0 ? G : i === 1 ? B : W;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    function loop(ts) { draw((ts || 0) / 1000); animId = requestAnimationFrame(loop); }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} width={120} height={120} style={{ width: size, height: size }} />;
}

export default function CinekasPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let admin = false;
      try {
        const user = await base44.auth.me();
        admin = !!user && user.role === 'admin';
      } catch {
        admin = false;
      }
      const seen = localStorage.getItem('cinekas_onboarded') === '1';
      if (!mounted) return;
      // Admins skip onboarding; everyone else sees it once per device
      if (admin || seen) {
        setShowOnboarding(false);
        setReady(true);
      } else {
        setShowOnboarding(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleEnter = () => {
    localStorage.setItem('cinekas_onboarded', '1');
    setShowOnboarding(false);
    setReady(true);
  };

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data === 'close_app' || e.data?.type === 'close_app') {
        navigate('/AppStore');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  if (showOnboarding) {
    return (
      <CinekasOnboarding
        onEnter={handleEnter}
        logo={<CinekasLogo size={32} />}
      />
    );
  }

  if (ready === null) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <CinekasLogo size={36} />
            <h3 className="text-white font-bold text-lg">CineKas</h3>
          </div>
          <button
            onClick={() => navigate('/AppStore')}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 w-full">
          <iframe
            src="https://cinekasxyz.base44.app"
            className="w-full h-full border-0"
            title="Cinekas"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}