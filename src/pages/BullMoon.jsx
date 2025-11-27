import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Moon, TrendingUp, Zap, Bell, Users, Clock, Calendar,
  ChevronRight, Sparkles, DollarSign, Shield, CheckCircle, ExternalLink, ChevronLeft, X, Trash2
} from "lucide-react";

export default function BullMoonPage() {
  const [moonPhase, setMoonPhase] = useState(null);
  const [nextBullMoon, setNextBullMoon] = useState(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateInfo, setDateInfo] = useState(null);
  const [loadingDateInfo, setLoadingDateInfo] = useState(false);
  
  const [user, setUser] = useState(null);
  const [customBullDates, setCustomBullDates] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newBullDate, setNewBullDate] = useState('');
  const [newBullDescription, setNewBullDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBullMoons, setScannedBullMoons] = useState([]);

  // Real eclipse data from NASA
  const realEclipses = [
    { date: new Date('2025-03-14T06:00:00Z'), type: 'Partial Solar Eclipse', description: 'Visible from Pacific, Americas' },
    { date: new Date('2025-03-29T10:00:00Z'), type: 'Partial Lunar Eclipse', description: 'Visible from Americas, Europe, Africa' },
    { date: new Date('2025-09-07T18:00:00Z'), type: 'Total Lunar Eclipse', description: 'Visible from Europe, Africa, Asia, Australia' },
    { date: new Date('2025-09-21T19:45:00Z'), type: 'Partial Solar Eclipse', description: 'Visible from South Pacific, Antarctica' },
    { date: new Date('2026-02-17T12:00:00Z'), type: 'Annular Solar Eclipse', description: 'Visible from Antarctica' },
    { date: new Date('2026-03-03T11:30:00Z'), type: 'Total Lunar Eclipse', description: 'Visible from Americas, Europe, Africa' },
    { date: new Date('2026-08-12T18:00:00Z'), type: 'Total Solar Eclipse', description: 'Visible from Arctic, Greenland, Iceland, Spain' },
    { date: new Date('2026-08-28T04:13:00Z'), type: 'Partial Lunar Eclipse', description: 'Visible from Americas, Europe, Africa, Middle East' }
  ];

  useEffect(() => {
    loadUser();
    calculateMoonPhase();
    loadCustomBullDates();
    const interval = setInterval(calculateMoonPhase, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    }
  };

  const loadCustomBullDates = async () => {
    try {
      const dates = await base44.entities.CustomBullDate.filter({ is_active: true });
      setCustomBullDates(dates);
    } catch (err) {
      console.error('Failed to load custom dates:', err);
    }
  };

  const isEclipse = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check custom admin-set dates
    const hasCustomDate = customBullDates.some(d => 
      new Date(d.eclipse_date).toISOString().split('T')[0] === dateStr
    );
    if (hasCustomDate) return true;

    // Check real eclipse data (within 24 hours)
    const hasRealEclipse = realEclipses.some(eclipse => {
      const eclipseDateStr = eclipse.date.toISOString().split('T')[0];
      return eclipseDateStr === dateStr;
    });
    if (hasRealEclipse) return true;

    return false;
  };

  const calculateMoonPhase = () => {
    const now = new Date();
    const lunarCycle = 29.53058867;
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    const diff = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = (diff % lunarCycle) / lunarCycle;

    let phaseName = '';
    let emoji = '';
    let isBullMoon = isEclipse(now);

    if (phase < 0.0625 || phase >= 0.9375) {
      phaseName = isBullMoon ? 'Solar Eclipse' : 'New Moon';
      emoji = isBullMoon ? '🌑🔥' : '🌑';
    } else if (phase < 0.1875) {
      phaseName = 'Waxing Crescent';
      emoji = '🌒';
    } else if (phase < 0.3125) {
      phaseName = 'First Quarter';
      emoji = '🌓';
    } else if (phase < 0.4375) {
      phaseName = 'Waxing Gibbous';
      emoji = '🌔';
    } else if (phase < 0.5625) {
      phaseName = isBullMoon ? 'Lunar Eclipse' : 'Full Moon';
      emoji = isBullMoon ? '🌕🔴' : '🌕';
    } else if (phase < 0.6875) {
      phaseName = 'Waning Gibbous';
      emoji = '🌖';
    } else if (phase < 0.8125) {
      phaseName = 'Last Quarter';
      emoji = '🌗';
    } else {
      phaseName = 'Waning Crescent';
      emoji = '🌘';
    }

    setMoonPhase({ name: phaseName, emoji, phase, isBullMoon });

    // Find next real eclipse
    const upcomingEclipses = [
      ...realEclipses.filter(e => e.date > now),
      ...customBullDates
        .filter(d => d.is_active && new Date(d.eclipse_date) > now)
        .map(d => ({
          date: new Date(d.eclipse_date),
          type: d.eclipse_type || 'Custom Event',
          description: d.description || 'Admin-set Bull Moon'
        }))
    ].sort((a, b) => a.date - b.date);

    if (upcomingEclipses.length > 0) {
      const nextEclipse = upcomingEclipses[0];
      const msToEclipse = nextEclipse.date - now;
      const totalMinutes = Math.floor(msToEclipse / (1000 * 60));
      const daysLeft = Math.floor(totalMinutes / (60 * 24));
      const hoursLeft = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutesLeft = totalMinutes % 60;

      setNextBullMoon({
        date: nextEclipse.date,
        daysLeft,
        hoursLeft,
        minutesLeft,
        type: nextEclipse.type,
        description: nextEclipse.description
      });
    } else {
      setNextBullMoon({
        date: new Date(),
        daysLeft: 0,
        hoursLeft: 0,
        minutesLeft: 0,
        type: 'No upcoming eclipses',
        description: 'Check back later'
      });
    }
  };



  const getMoonPhaseForDate = (date) => {
    const lunarCycle = 29.53058867;
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = (diff % lunarCycle) / lunarCycle;

    let emoji = '';
    let isBullMoon = isEclipse(date);
    let phaseName = '';

    if (phase < 0.0625 || phase >= 0.9375) {
      emoji = isBullMoon ? '🌑🔥' : '🌑';
      phaseName = isBullMoon ? 'Solar Eclipse' : 'New Moon';
    } else if (phase < 0.1875) {
      emoji = '🌒';
      phaseName = 'Waxing Crescent';
    } else if (phase < 0.3125) {
      emoji = '🌓';
      phaseName = 'First Quarter';
    } else if (phase < 0.4375) {
      emoji = '🌔';
      phaseName = 'Waxing Gibbous';
    } else if (phase < 0.5625) {
      emoji = isBullMoon ? '🌕🔴' : '🌕';
      phaseName = isBullMoon ? 'Lunar Eclipse' : 'Full Moon';
    } else if (phase < 0.6875) {
      emoji = '🌖';
      phaseName = 'Waning Gibbous';
    } else if (phase < 0.8125) {
      emoji = '🌗';
      phaseName = 'Last Quarter';
    } else {
      emoji = '🌘';
      phaseName = 'Waning Crescent';
    }

    return { emoji, isBullMoon, phase, phaseName };
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
    setSelectedYear(newDate.getFullYear());
  };

  const changeYear = (direction) => {
    const newYear = currentMonth.getFullYear() + direction;
    if (newYear >= 1 && newYear <= 3000) {
      const newDate = new Date(currentMonth);
      newDate.setFullYear(newYear);
      setCurrentMonth(newDate);
      setSelectedYear(newYear);
    }
  };

  const handleScanBullMoons = () => {
    setIsScanning(true);
    const bullMoons = [];
    const startDate = new Date(currentMonth.getFullYear(), 0, 1);
    const endDate = new Date(currentMonth.getFullYear(), 11, 31);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (isEclipse(new Date(d))) {
        bullMoons.push(new Date(d));
      }
    }
    
    setScannedBullMoons(bullMoons);
    setIsScanning(false);
    
    if (bullMoons.length > 0) {
      setCurrentMonth(new Date(bullMoons[0]));
    }
  };

  const handleDateClick = async (date) => {
    setSelectedDate(date);
    setLoadingDateInfo(true);
    setDateInfo(null);

    try {
      const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const moonData = getMoonPhaseForDate(date);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `What significant historical events happened on ${monthDay} throughout history? Include events from both BC/BCE and AD/CE eras. ${monthDay === 'December 25' ? 'Make sure to mention Jesus Christ\'s birthday (traditionally celebrated on this date). ' : ''}Provide 4-6 notable events from different time periods. Format as a bulleted list with years. Be concise and interesting.

Also, on this date the moon phase is: ${moonData.phaseName} (${(moonData.phase * 100).toFixed(1)}% through lunar cycle). ${moonData.isBullMoon ? 'This is a Bull Moon - an eclipse event, which is a rare opportunity to buy Kaspa!' : ''}`,
        add_context_from_internet: true
      });
      
      setDateInfo(response || 'No information available for this date.');
    } catch (error) {
      console.error('Failed to fetch date info:', error);
      setDateInfo('Unable to load historical information for this date.');
    } finally {
      setLoadingDateInfo(false);
    }
  };

  const handleNotificationSignup = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    try {
      await base44.entities.BullMoonAlert.create({
        user_email: email,
        phone_number: phone || '',
        is_active: true,
        days_before: 1
      });

      setNotificationSaved(true);
      setTimeout(() => {
        setNotificationSaved(false);
        setEmail('');
        setPhone('');
      }, 3000);

      alert('✅ Notifications enabled! You\'ll receive alerts 1 day before each Bull Moon.');
    } catch (err) {
      console.error('Failed to save alert:', err);
      alert('Failed to save notification settings: ' + err.message);
    }
  };

  const handleAddBullDate = async () => {
    if (!newBullDate) {
      alert('Please select a date');
      return;
    }

    try {
      const newDate = new Date(newBullDate);
      
      await base44.entities.CustomBullDate.create({
        eclipse_date: newDate.toISOString(),
        eclipse_type: 'custom',
        description: newBullDescription || 'Admin-set Bull Moon',
        is_active: true
      });

      // Send instant notifications to all users with active alerts
      try {
        const alerts = await base44.entities.BullMoonAlert.filter({ is_active: true });
        const today = new Date();
        const daysUntil = Math.floor((newDate - today) / (1000 * 60 * 60 * 24));
        
        if (alerts.length > 0 && daysUntil >= 0 && daysUntil <= 30) {
          const isToday = daysUntil === 0;
          
          for (const alert of alerts) {
            try {
              await base44.integrations.Core.SendEmail({
                from_name: 'Bull Moon Alerts',
                to: alert.user_email,
                subject: isToday 
                  ? `🌑 BULL MOON TODAY - ${newBullDescription || 'Special Event'} - Buy Kaspa Now!`
                  : `🌙 New Bull Moon Alert: ${newBullDescription || 'Special Event'} in ${daysUntil} day(s)!`,
                body: `
🚀 ${isToday ? '⚡ BULL MOON TODAY ⚡' : 'New Bull Moon Announced!'}

${isToday 
  ? `${newBullDescription || 'A special Bull Moon event'} is happening RIGHT NOW! This is your opportunity to buy Kaspa!`
  : `${newBullDescription || 'A special Bull Moon event'} has been scheduled for ${newDate.toLocaleDateString()}!`
}

📅 Date: ${newDate.toLocaleDateString()}
🌙 Type: Custom Bull Moon Event
⏰ ${isToday ? 'Buy NOW!' : `${daysUntil} day(s) until the event`}

${isToday 
  ? '💎 BUY KASPA NOW - The Bull Moon is here!'
  : 'Mark your calendar and get ready to buy Kaspa following the Bull Moon strategy.'}

👉 Buy Kaspa: https://www.topperpay.com/?crypto=KAS
👉 Learn More: https://ttt.kaspa.org/#/BullMoon

${isToday ? '⚡ Don\'t miss this opportunity! ⚡' : 'Never miss a Bull Moon - The simplest way to accumulate KAS.'}

---
To unsubscribe, visit your profile settings.
                `
              });
            } catch (emailErr) {
              console.error('Failed to send email to:', alert.user_email, emailErr);
            }
          }
          
          alert(`✅ Bull Moon date added! ${alerts.length} notification(s) sent.`);
        } else {
          alert('✅ Bull Moon date added successfully!');
        }
      } catch (notifyErr) {
        console.error('Failed to send notifications:', notifyErr);
        alert('✅ Bull Moon date added, but some notifications failed to send.');
      }

      await loadCustomBullDates();
      calculateMoonPhase();
      setNewBullDate('');
      setNewBullDescription('');
    } catch (err) {
      console.error('Failed to add date:', err);
      alert('Failed to add date: ' + err.message);
    }
  };

  const handleDeleteBullDate = async (dateId) => {
    if (!confirm('Delete this Bull Moon date?')) return;

    try {
      await base44.entities.CustomBullDate.delete(dateId);
      await loadCustomBullDates();
      calculateMoonPhase();
    } catch (err) {
      console.error('Failed to delete date:', err);
      alert('Failed to delete date');
    }
  };

  const handleBuyClick = () => {
    // Open Topper Pay with Kaspa pre-selected
    window.open('https://www.topperpay.com/?crypto=KAS', '_blank');
  };

  const buyingGuideSteps = [
    {
      step: 1,
      title: "Click 'Buy Kaspa Now'",
      description: "This opens Topper Pay, a trusted platform for buying crypto with your credit card or bank account."
    },
    {
      step: 2,
      title: "Enter Amount",
      description: "Choose how much USD/EUR you want to spend. No minimum required."
    },
    {
      step: 3,
      title: "Enter Your Kaspa Wallet Address",
      description: "Paste your Kaspa receiving address from your TTT Wallet or Kasware."
    },
    {
      step: 4,
      title: "Complete Payment",
      description: "Enter your payment details. Kaspa arrives in 5-15 minutes."
    }
  ];



  if (!moonPhase || !nextBullMoon) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Moon className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-black border border-white/5 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/30">AI-Powered Moon Cycle Tracker</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-3 tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Bull Moon
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-2">
              The Simplest Way to Buy Kaspa
            </p>
            <p className="text-sm md:text-base text-white/40 max-w-2xl mx-auto">
              No charts. No stress. Just follow the moon cycles.
            </p>
          </motion.div>

          {/* Current Moon Phase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`bg-black ${moonPhase.isBullMoon ? 'border-white/20' : 'border-white/5'} transition-all duration-500`}>
              <CardContent className="p-6 md:p-8">
                <div className="text-center">
                  {/* NASA Live Moon Phase Visualization */}
                  <div className="relative w-full max-w-sm md:max-w-md mx-auto mb-6">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                      <iframe
                        src={`https://moon.nasa.gov/moon-observation/daily-moon-guide/?intent=011`}
                        className="w-full h-full"
                        title="NASA Daily Moon Phase"
                        style={{ border: 'none' }}
                      />
                    </div>
                    <p className="text-center text-white/40 text-xs mt-2">
                      Live moon phase from NASA
                    </p>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">{moonPhase.name}</h2>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Countdown */}
          {!moonPhase.isBullMoon && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Card className="bg-black border-white/5">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-white/40" />
                        <span className="text-white/40 text-sm md:text-base">Next Eclipse</span>
                      </div>
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                      >
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">View Calendar</span>
                      </button>
                    </div>
                    {nextBullMoon?.type && (
                      <div className="text-center mb-3">
                        <div className="text-cyan-400 font-semibold text-sm md:text-base">{nextBullMoon.type}</div>
                        <div className="text-white/40 text-xs">{nextBullMoon.description}</div>
                        <div className="text-white/60 text-xs mt-1">{nextBullMoon.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black border border-white/5 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-5xl md:text-7xl font-black text-white tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        {nextBullMoon.daysLeft}
                      </div>
                      <div className="text-xs md:text-sm text-white/30 mt-2 font-medium tracking-wider uppercase">Days</div>
                    </div>
                    <div className="bg-black border border-white/5 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-5xl md:text-7xl font-black text-white tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        {nextBullMoon.hoursLeft % 24}
                      </div>
                      <div className="text-xs md:text-sm text-white/30 mt-2 font-medium tracking-wider uppercase">Hours</div>
                    </div>
                    <div className="bg-black border border-white/5 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-5xl md:text-7xl font-black text-white tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900 }}>
                        {nextBullMoon.minutesLeft}
                      </div>
                      <div className="text-xs md:text-sm text-white/30 mt-2 font-medium tracking-wider uppercase">Minutes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Buy Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 space-y-4"
          >
            <Button
              onClick={handleBuyClick}
              className="w-full bg-black border-2 border-white text-white hover:bg-white/10 font-bold text-base md:text-lg h-14 md:h-16 rounded-xl"
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              Buy Kaspa Now
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </Button>

            <Button
              onClick={() => setShowGuide(!showGuide)}
              variant="ghost"
              className="w-full bg-black border border-white/10 text-white/60 hover:bg-black hover:text-white hover:border-white/20 h-12 rounded-xl text-sm md:text-base"
            >
              {showGuide ? 'Hide' : 'Show'} Buying Guide
              <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showGuide ? 'rotate-90' : ''}`} />
            </Button>
          </motion.div>

          {/* Buying Guide */}
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <Card className="bg-black border-white/5">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-white/60" />
                    How to Buy Kaspa (4 Easy Steps)
                  </h3>
                  <div className="space-y-4">
                    {buyingGuideSteps.map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                          <p className="text-white/40 text-sm">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 bg-black border border-white/10 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white text-sm font-semibold mb-1">Need a Wallet?</p>
                        <p className="text-white/40 text-sm">
                          Go to TTT Wallet or download Kasware extension to get your Kaspa address.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}



          {/* Admin Panel */}
          {user && user.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6"
            >
              <Card className="bg-black border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                      <Shield className="w-5 h-5" />
                      Admin: Set Bull Moon Dates
                    </h3>
                    <Button
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white"
                    >
                      {showAdminPanel ? 'Hide' : 'Show'}
                    </Button>
                  </div>

                  {showAdminPanel && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Input
                          type="date"
                          value={newBullDate}
                          onChange={(e) => setNewBullDate(e.target.value)}
                          className="bg-black border-white/10 text-white h-12"
                          style={{ colorScheme: 'dark' }}
                        />
                        <Input
                          type="text"
                          placeholder="Description (optional)"
                          value={newBullDescription}
                          onChange={(e) => setNewBullDescription(e.target.value)}
                          className="bg-black border-white/10 text-white placeholder:text-white/30 h-12"
                        />
                        <Button
                          onClick={handleAddBullDate}
                          className="w-full bg-cyan-500 text-white hover:bg-cyan-600 h-12"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Add Bull Moon Date
                        </Button>
                      </div>

                      {customBullDates.length > 0 && (
                        <div className="border-t border-white/10 pt-4">
                          <h4 className="text-sm text-white/60 mb-2">Active Bull Dates:</h4>
                          <div className="space-y-2">
                            {customBullDates.map((date) => (
                              <div key={date.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                  <div className="text-white font-semibold">
                                    {format(new Date(date.eclipse_date), 'MMM d, yyyy')}
                                  </div>
                                  {date.description && (
                                    <div className="text-white/40 text-xs">{date.description}</div>
                                  )}
                                </div>
                                <Button
                                  onClick={() => handleDeleteBullDate(date.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notification Signup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card className="bg-black border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-white/60" />
                  Get Notified
                </h3>
                <p className="text-white/40 text-sm mb-4">
                  Receive email alerts 1 day before each Bull Moon. Never miss a buying opportunity.
                </p>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black border-white/10 text-white placeholder:text-white/30 h-12"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone (optional - SMS coming soon)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-black border-white/10 text-white placeholder:text-white/30 h-12"
                  />
                  <Button
                    onClick={handleNotificationSignup}
                    className="w-full bg-white/10 border border-white/10 text-white hover:bg-white/20 h-12"
                  >
                    {notificationSaved ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        Enable Email Notifications
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Strategy Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Card className="bg-black border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-white/60" />
                  The Bull Moon Strategy
                </h3>
                <div className="space-y-4 text-white/40 text-sm md:text-base">
                  <p>
                    <strong className="text-white">Simple Rule:</strong> Buy Kaspa during Solar and Lunar Eclipses. That's it.
                  </p>
                  <p>
                    <strong className="text-white">Why Eclipses:</strong> Eclipses are rare celestial events that occur 2-4 times per year. This creates a disciplined, infrequent buying schedule - perfect for long-term accumulation without emotional decisions.
                  </p>
                  <p>
                    <strong className="text-white">Community Power:</strong> When thousands of people buy together during eclipses, it creates natural buying pressure and price support.
                  </p>
                  <p>
                    <strong className="text-white">Long-term Focus:</strong> This is a accumulation strategy, not day trading. Buy and hold. Let time do the work.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Moon Phase Calendar Modal */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCalendar(false)}
                className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="sticky top-0 bg-black border-b border-white/10 p-6 z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Moon Phase Calendar</h2>
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <button
                        onClick={() => changeYear(-100)}
                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <ChevronLeft className="w-4 h-4 -ml-2" />
                      </button>
                      <button
                        onClick={() => changeYear(-1)}
                        className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="text-3xl font-black text-white min-w-[140px] text-center tracking-tight">
                        {selectedYear}
                      </div>
                      <button
                        onClick={() => changeYear(1)}
                        className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => changeYear(100)}
                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <ChevronRight className="w-4 h-4 -ml-2" />
                      </button>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={() => changeMonth(-1)}
                        className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="text-xl font-bold text-white min-w-[200px] text-center">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long' })} {currentMonth.getFullYear()}
                      </div>
                      <button
                        onClick={() => changeMonth(1)}
                        className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Date Input & Auto Scan */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">Jump to:</span>
                        <input
                          type="date"
                          onChange={(e) => {
                            if (e.target.value) {
                              const selectedDate = new Date(e.target.value + 'T12:00:00');
                              setCurrentMonth(selectedDate);
                              setSelectedYear(selectedDate.getFullYear());
                              handleDateClick(selectedDate);
                            }
                          }}
                          className="bg-black border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 hover:border-white/30 transition-colors cursor-pointer"
                          style={{
                            colorScheme: 'dark'
                          }}
                        />
                        <button
                          onClick={() => {
                            const dec25 = new Date(currentMonth.getFullYear(), 11, 25);
                            setCurrentMonth(dec25);
                            handleDateClick(dec25);
                          }}
                          className="bg-white/5 border border-white/20 text-white/80 hover:bg-white/10 hover:text-white rounded-lg px-3 py-2 text-sm transition-colors"
                        >
                          Dec 25
                        </button>
                      </div>
                      
                      <button
                        onClick={handleScanBullMoons}
                        disabled={isScanning}
                        className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        {isScanning ? (
                          <>
                            <Sparkles className="w-4 h-4 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Find All Bull Moons
                          </>
                        )}
                      </button>
                    </div>
                    
                    {scannedBullMoons.length > 0 && (
                      <div className="mt-3 text-center">
                        <div className="text-sm text-cyan-400 font-semibold">
                          Found {scannedBullMoons.length} Bull Moon{scannedBullMoons.length > 1 ? 's' : ''} in {selectedYear}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                          {scannedBullMoons.map((date, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentMonth(date);
                                handleDateClick(date);
                              }}
                              className="bg-white/5 border border-white/20 text-white/80 hover:bg-white/10 rounded-lg px-2 py-1 text-xs"
                            >
                              {format(date, 'MMM d')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>

                  <div className="p-6">
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-white/40 text-sm font-semibold p-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                        const moonData = getMoonPhaseForDate(date);
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                          <motion.div
                            key={day}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleDateClick(date)}
                            className={`aspect-square border ${
                              moonData.isBullMoon 
                                ? 'bg-white/10 border-white/30' 
                                : 'bg-black border-white/5'
                            } ${isToday ? 'ring-2 ring-white/50' : ''} rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5`}
                          >
                            <div className={`text-xs font-semibold mb-1 ${
                              moonData.isBullMoon ? 'text-white' : 'text-white/60'
                            }`}>
                              {day}
                            </div>
                            
                            {/* Mini Moon Visualization - Accurate Lunar Phase */}
                            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-gray-600 via-gray-500 to-gray-700 shadow-sm">
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-[25%] left-[30%] w-1.5 h-1.5 rounded-full bg-gray-800/40 blur-[1px]" />
                                <div className="absolute top-[50%] left-[65%] w-2 h-2 rounded-full bg-gray-900/30 blur-[1px]" />
                              </div>
                              <div 
                                className="absolute inset-0 bg-black"
                                style={{
                                  clipPath: (() => {
                                    const p = moonData.phase;
                                    if (p < 0.0625 || p >= 0.9375) return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
                                    if (p < 0.25) {
                                      const width = (1 - (p / 0.25)) * 50;
                                      return `polygon(${50 - width}% 0%, 100% 0%, 100% 100%, ${50 - width}% 100%)`;
                                    }
                                    if (p < 0.5) {
                                      const width = ((p - 0.25) / 0.25) * 50;
                                      return `polygon(0% 0%, ${width}% 0%, ${width}% 100%, 0% 100%)`;
                                    }
                                    if (p < 0.5625) return 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
                                    if (p < 0.75) {
                                      const width = ((p - 0.5) / 0.25) * 50;
                                      return `polygon(0% 0%, ${50 + width}% 0%, ${50 + width}% 100%, 0% 100%)`;
                                    }
                                    const width = (1 - ((p - 0.75) / 0.25)) * 50;
                                    return `polygon(${50 + width}% 0%, 100% 0%, 100% 100%, ${50 + width}% 100%)`;
                                  })()
                                }}
                              />
                            </div>
                            
                            {moonData.isBullMoon && (
                              <div className="text-[8px] text-white/80 mt-1 text-center leading-tight font-bold">
                                BUY
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white/10 border border-white/30 rounded" />
                        <span className="text-white/60">Eclipse (Buy Window)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-black border border-white/5 rounded" />
                        <span className="text-white/60">Regular Day</span>
                      </div>
                    </div>

                    {/* Date Info Panel */}
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 bg-black border border-white/20 rounded-xl p-6 max-h-96 flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-sm text-white/60">
                                Moon: {getMoonPhaseForDate(selectedDate).phaseName}
                              </div>
                              <div className="text-xs text-white/40">
                                {(getMoonPhaseForDate(selectedDate).phase * 100).toFixed(1)}% cycle
                              </div>
                              {getMoonPhaseForDate(selectedDate).isBullMoon && (
                                <div className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                                  BULL MOON
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(null);
                              setDateInfo(null);
                            }}
                            className="text-white/40 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {loadingDateInfo ? (
                          <div className="flex items-center justify-center py-8">
                            <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                          </div>
                        ) : dateInfo ? (
                          <div className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto pr-2">
                            {dateInfo}
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}