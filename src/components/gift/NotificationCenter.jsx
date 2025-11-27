import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X, TrendingDown, Gift, Users, Sparkles, Check } from "lucide-react";

export default function NotificationCenter({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const notifs = await base44.entities.GiftNotification.filter({
        user_email: user.email
      }, '-created_date', 20);
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await base44.entities.GiftNotification.update(id, { is_read: true });
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notif of notifications.filter(n => !n.is_read)) {
        await base44.entities.GiftNotification.update(notif.id, { is_read: true });
      }
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'price_drop':
      case 'price_alert':
        return <TrendingDown className="w-5 h-5 text-green-400" />;
      case 'invitation':
        return <Users className="w-5 h-5 text-cyan-400" />;
      case 'item_claimed':
        return <Gift className="w-5 h-5 text-purple-400" />;
      case 'ai_suggestion':
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      default:
        return <Bell className="w-5 h-5 text-white/60" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-orange-400' : 'text-white/60'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPanel(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-zinc-950 border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-950">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </h3>
                  <Button
                    onClick={() => setShowPanel(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    size="sm"
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/5"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
              </div>

              <div className="p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Card
                      key={notif.id}
                      className={`border transition-all cursor-pointer ${
                        notif.is_read
                          ? 'bg-black border-white/10'
                          : 'bg-white/5 border-orange-500/30'
                      }`}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-sm mb-1">
                              {notif.title}
                            </h4>
                            <p className="text-white/60 text-xs">
                              {notif.message}
                            </p>
                            <p className="text-white/40 text-xs mt-2">
                              {new Date(notif.created_date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}