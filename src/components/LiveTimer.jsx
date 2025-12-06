import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function LiveTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, expired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, expired: false };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-1 text-red-400 text-xs">
        <Clock className="w-3 h-3" />
        <span className="font-mono">Expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-white text-xs">
      <Clock className="w-3 h-3 text-green-400" />
      <span className="font-mono font-semibold">
        {timeLeft.hours}h {timeLeft.minutes}m
      </span>
    </div>
  );
}