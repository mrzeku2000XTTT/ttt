import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function AdminRoute({ children }) {
  const [state, setState] = useState("loading");

  useEffect(() => {
    base44.auth.me()
      .then(u => setState(u?.role === "admin" ? "admin" : "denied"))
      .catch(() => setState("denied"));
  }, []);

  if (state === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/AppStoreV2" replace />;
  }

  return children;
}