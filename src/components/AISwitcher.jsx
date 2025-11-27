import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bot, Brain, Zap, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AISwitcher({ currentAI, onSwitch }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const aiOptions = [
    {
      id: 'bridge',
      name: 'Bridge Assistant',
      icon: Zap,
      color: 'from-cyan-500 to-blue-500',
      description: 'Help with bridging'
    },
    {
      id: 'zeku',
      name: 'Zeku AI',
      icon: Bot,
      color: 'from-purple-500 to-pink-500',
      description: 'Smart research',
      page: 'ZekuAI'
    },
    {
      id: 'ying',
      name: 'Agent Ying',
      icon: Brain,
      color: 'from-green-500 to-emerald-500',
      description: 'Vision & Memory'
    }
  ];

  const currentOption = aiOptions.find(ai => ai.id === currentAI) || aiOptions[0];
  const CurrentIcon = currentOption.icon;

  const handleSelect = (ai) => {
    setIsOpen(false);
    
    if (ai.page) {
      navigate(createPageUrl(ai.page));
    } else if (onSwitch) {
      onSwitch(ai.id);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        className={`bg-gradient-to-r ${currentOption.color} text-white h-8 px-3 shadow-lg`}
      >
        <CurrentIcon className="w-4 h-4 mr-2" />
        <span className="text-xs font-semibold">{currentOption.name}</span>
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[45]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-zinc-900 border border-white/20 rounded-xl overflow-hidden shadow-xl z-[46] min-w-[200px]"
            >
              {aiOptions.map((ai) => {
                const Icon = ai.icon;
                const isCurrent = ai.id === currentAI;
                
                return (
                  <button
                    key={ai.id}
                    onClick={() => handleSelect(ai)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10 last:border-0 ${
                      isCurrent ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r ${ai.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-white text-sm font-semibold">{ai.name}</div>
                      <div className="text-gray-400 text-xs">{ai.description}</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}