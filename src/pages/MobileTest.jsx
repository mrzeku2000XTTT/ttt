import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Tablet, Monitor, RotateCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function MobileTestPage() {
  const [device, setDevice] = useState('iphone'); // iphone, android, tablet
  const [orientation, setOrientation] = useState('portrait'); // portrait, landscape

  const devices = {
    iphone: {
      name: 'iPhone 14 Pro',
      width: orientation === 'portrait' ? 393 : 852,
      height: orientation === 'portrait' ? 852 : 393,
      scale: 0.8
    },
    android: {
      name: 'Samsung Galaxy S23',
      width: orientation === 'portrait' ? 360 : 780,
      height: orientation === 'portrait' ? 780 : 360,
      scale: 0.8
    },
    tablet: {
      name: 'iPad Pro',
      width: orientation === 'portrait' ? 768 : 1024,
      height: orientation === 'portrait' ? 1024 : 768,
      scale: 0.7
    }
  };

  const currentDevice = devices[device];
  const appUrl = window.location.origin + '/#/Bridge'; // Change this to test different pages

  const toggleOrientation = () => {
    setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">VibeCode Mobile Test Environment</h1>
          <p className="text-gray-400">Test how your webapp will look inside VibeCode mobile app</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex gap-2 bg-black/50 p-2 rounded-lg border border-white/10">
            <Button
              onClick={() => setDevice('iphone')}
              variant={device === 'iphone' ? 'default' : 'ghost'}
              size="sm"
              className={device === 'iphone' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              iPhone
            </Button>
            <Button
              onClick={() => setDevice('android')}
              variant={device === 'android' ? 'default' : 'ghost'}
              size="sm"
              className={device === 'android' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Android
            </Button>
            <Button
              onClick={() => setDevice('tablet')}
              variant={device === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              className={device === 'tablet' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}
            >
              <Tablet className="w-4 h-4 mr-2" />
              Tablet
            </Button>
          </div>

          <Button
            onClick={toggleOrientation}
            variant="outline"
            size="sm"
            className="bg-black/50 border-white/10 text-white"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
          </Button>
        </div>

        {/* Device Info */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">
            {currentDevice.name} • {currentDevice.width}x{currentDevice.height}px • {orientation}
          </p>
        </div>

        {/* Device Frame */}
        <div className="flex justify-center items-center min-h-[800px]">
          <motion.div
            key={`${device}-${orientation}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
            style={{
              width: currentDevice.width * currentDevice.scale,
              height: currentDevice.height * currentDevice.scale,
            }}
          >
            {/* Device Frame */}
            <div className="absolute inset-0 bg-black rounded-[40px] shadow-2xl border-8 border-gray-800 overflow-hidden">
              {/* Notch (for iPhone) */}
              {device === 'iphone' && orientation === 'portrait' && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50" />
              )}

              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-black/90 backdrop-blur-xl flex items-center justify-between px-4 z-40">
                <span className="text-white text-xs font-semibold">9:41</span>
                <span className="text-white text-xs">VibeCode</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                </div>
              </div>

              {/* App Content - Iframe */}
              <div className="absolute top-10 left-0 right-0 bottom-0 bg-black overflow-hidden">
                <iframe
                  src={appUrl}
                  className="w-full h-full border-0"
                  title="TTT App Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />
              </div>

              {/* Home Indicator (for iPhone) */}
              {device === 'iphone' && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-50" />
              )}
            </div>

            {/* Physical Buttons */}
            <div className="absolute -right-2 top-20 w-1 h-12 bg-gray-700 rounded-r" />
            <div className="absolute -right-2 top-36 w-1 h-8 bg-gray-700 rounded-r" />
            <div className="absolute -left-2 top-24 w-1 h-8 bg-gray-700 rounded-l" />
          </motion.div>
        </div>

        {/* Instructions */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Monitor className="w-6 h-6 text-cyan-400" />
              VibeCode Integration Instructions
            </h2>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">📱 For VibeCode Team</h3>
                <p className="text-sm leading-relaxed">
                  "Please make the VibeCode app open our TTT webapp inside your built-in browser. 
                  The webapp should be fully interactive, isolated from other app data, and able to 
                  communicate securely with the VibeCode environment via a JS messaging bridge for 
                  wallet and AI integration. It should behave like a native screen inside the app."
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">🔧 Technical Requirements</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Open webapp URL: <code className="bg-black/50 px-2 py-1 rounded text-cyan-400">{window.location.origin}</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Use WKWebView (iOS) or WebView (Android) with JavaScript enabled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Enable inline media playback and full-screen support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Sandbox the environment for security isolation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Support wallet interactions (MetaMask, Kasware, Kas3X)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">🔗 Optional JS Bridge</h3>
                <p className="text-sm leading-relaxed mb-3">
                  For future wallet/AI integration, implement a message bridge:
                </p>
                <div className="bg-black/70 rounded-lg p-4 font-mono text-xs text-cyan-300 overflow-x-auto">
                  <pre>{`// iOS (Swift)
webView.configuration.userContentController
  .add(self, name: "vibecode")

// Android (Kotlin)  
webView.addJavascriptInterface(
  VibeCodeBridge(this), "vibecode"
)

// Webapp can call:
window.vibecode.postMessage({
  type: "wallet_sign",
  data: {...}
})`}</pre>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Important Notes</h3>
                <ul className="space-y-1 text-sm">
                  <li>• App must handle loading states and network errors</li>
                  <li>• Respect safe area insets (notch, home indicator)</li>
                  <li>• Test on multiple devices and orientations</li>
                  <li>• Ensure smooth scrolling and touch interactions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}