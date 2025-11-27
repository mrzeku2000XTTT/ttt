import React, { useState, useEffect } from 'react';
import SubscriptionSystem from './SubscriptionSystem';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSubscription();
    
    // Check subscription every 10 seconds
    const interval = setInterval(checkSubscription, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkSubscription = () => {
    const saved = localStorage.getItem('subscription');
    if (saved) {
      const data = JSON.parse(saved);
      
      // Check if subscription is expired
      if (data.isActive && data.expiresAt < Date.now()) {
        data.isActive = false;
      }
      
      setSubscription(data);
    } else {
      setSubscription({
        isActive: false,
        expiresAt: 0,
        autoRenew: false,
      });
    }
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!subscription?.isActive) {
    return <SubscriptionSystem />;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <SubscriptionSystem />
        </div>
        {children}
      </div>
    </div>
  );
}