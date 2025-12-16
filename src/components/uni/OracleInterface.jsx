import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function OracleInterface() {
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, listening, thinking, speaking
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const canvasRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onstart = () => {
                    setIsListening(true);
                    setStatus('listening');
                    setTranscript('');
                };

                recognitionRef.current.onresult = (event) => {
                    const text = event.results[0][0].transcript;
                    setTranscript(text);
                    handleOracleQuery(text);
                };

                recognitionRef.current.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                    setStatus('idle');
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                    if (status === 'listening') {
                        // If we just stopped listening normally, status will change in handleOracleQuery
                        // If it stopped without result, go back to idle
                        // We'll let handleOracleQuery manage the transition
                    }
                };
            }
        }
    }, []);

    // Visualizer Loop
    useEffect(() => {
        let animationFrame;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const time = Date.now() / 1000;

            if (status === 'listening') {
                // Pulse effect
                ctx.beginPath();
                const radius = 30 + Math.sin(time * 10) * 5;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = '#0f0';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Inner circle
                ctx.beginPath();
                ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#0f0';
                ctx.fill();
            } else if (status === 'thinking') {
                // Spinning loader
                ctx.beginPath();
                ctx.arc(centerX, centerY, 30, time * 5, time * 5 + Math.PI);
                ctx.strokeStyle = '#0f0';
                ctx.lineWidth = 4;
                ctx.stroke();
            } else if (status === 'speaking') {
                // Waveform simulation
                ctx.beginPath();
                ctx.moveTo(0, centerY);
                for (let i = 0; i < canvas.width; i++) {
                    const amplitude = 20 * Math.sin(time * 10);
                    const y = centerY + Math.sin(i * 0.1 + time * 5) * amplitude * Math.sin(time * 2);
                    ctx.lineTo(i, y);
                }
                ctx.strokeStyle = '#0f0';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                // Idle static
                ctx.beginPath();
                ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.fill();
            }

            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [status]);

    const handleOracleQuery = async (text) => {
        setStatus('thinking');
        try {
            // 1. Get LLM Response
            const { data: llmData } = await base44.functions.invoke('uniOracle', { message: text });
            const aiText = llmData.reply;
            setResponse(aiText);

            // 2. Get Audio
            const { data: audioData } = await base44.functions.invoke('elevenLabsTTS', { 
                text: aiText,
                voice_id: 'EXAVITQu4vr4xnSDxMaL' // Bella - Soft & Calm
            }, { responseType: 'arraybuffer' });

            // 3. Play Audio
            const blob = new Blob([audioData], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                setStatus('speaking');
                
                audioRef.current.onended = () => {
                    setStatus('idle');
                    URL.revokeObjectURL(url);
                };
            }
        } catch (error) {
            console.error('Oracle Error:', error);
            setStatus('idle');
            setResponse('Connection interrupted...');
        }
    };

    const toggleListening = () => {
        try {
            if (isListening) {
                recognitionRef.current?.stop();
                setIsListening(false);
            } else {
                setResponse('');
                setTranscript('');
                recognitionRef.current?.start();
            }
        } catch (error) {
            console.error("Speech recognition error:", error);
            // If we get an "already started" error, just set state to listening
            if (error.name === 'InvalidStateError' || error.message?.includes('already started')) {
                setIsListening(true);
                setStatus('listening');
            } else {
                setIsListening(false);
                setStatus('idle');
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto p-6 relative z-20">
            {/* Visualizer Canvas */}
            <div className="relative w-64 h-32 bg-black/50 border border-green-500/30 rounded-lg overflow-hidden backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,0,0.2)]">
                <canvas 
                    ref={canvasRef} 
                    width={256} 
                    height={128} 
                    className="w-full h-full"
                />
                <div className="absolute top-2 right-2 text-[10px] text-green-500/50 font-mono">
                    STATUS: {status.toUpperCase()}
                </div>
            </div>

            {/* Controls */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                className={`
                    w-20 h-20 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300
                    ${status === 'listening' 
                        ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(255,0,0,0.4)] animate-pulse' 
                        : 'bg-green-500/10 border-green-500 text-green-500 hover:bg-green-500/20 shadow-[0_0_20px_rgba(0,255,0,0.2)]'
                    }
                `}
            >
                {status === 'listening' ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
            </motion.button>

            {/* Transcript / Response Display */}
            <div className="min-h-[100px] w-full text-center space-y-4">
                <AnimatePresence mode="wait">
                    {transcript && (
                        <motion.div
                            key="transcript"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-green-500/60 font-mono text-sm"
                        >
                            &gt; {transcript}
                        </motion.div>
                    )}
                    
                    {response && (
                        <motion.div
                            key="response"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-green-400 font-bold text-lg p-4 bg-green-900/10 border border-green-500/20 rounded-lg shadow-[0_0_10px_rgba(0,255,0,0.1)]"
                        >
                            {response}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hidden Audio Element */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}