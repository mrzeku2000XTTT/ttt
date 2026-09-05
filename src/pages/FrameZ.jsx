import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import BackToStore from '@/components/BackToStore';
import FramezStudio from '@/components/framez/studio/FramezStudio';

/**
 * FrameZ — HyperFrames for everyone. Natural language in, coded motion
 * film out: the agent plans shots, writes the HTML/JS code for each one
 * (visible as thinking bubbles), renders it live in a same-origin iframe,
 * and exports it as a real video file.
 */
export default function FrameZPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        if (u?.role !== 'admin') {
          navigate('/AppStoreV2');
          return;
        }
        setUser(u);
      })
      .catch(() => navigate('/AppStoreV2'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <BackToStore />
      <FramezStudio />
    </>
  );
}