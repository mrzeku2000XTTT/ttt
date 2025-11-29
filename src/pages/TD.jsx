import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Video, Square, Play, Pause, Download, FileText, Settings, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";

export default function TDPage() {
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(true);
  const [notesPosition, setNotesPosition] = useState("bottom");
  const [fontSize, setFontSize] = useState(24);
  const [notesOpacity, setNotesOpacity] = useState(0.9);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: "user" },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access denied. Please allow camera and microphone access.");
    }
  };

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setRecordedChunks([]);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Stream Helper</h1>
              <p className="text-xs text-white/60">Record with on-screen notes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Preview */}
        <div className="flex-1 relative bg-black">
          {!stream ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-6 text-lg"
              >
                <Video className="w-6 h-6 mr-3" />
                Start Camera
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* On-Screen Notes Overlay */}
              {showNotes && notes && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: notesOpacity }}
                  className={`absolute left-0 right-0 ${
                    notesPosition === "top" ? "top-0" : "bottom-0"
                  } p-6 bg-gradient-to-${notesPosition === "top" ? "b" : "t"} from-black/80 to-transparent`}
                >
                  <div
                    className="text-white text-center leading-relaxed whitespace-pre-wrap max-w-4xl mx-auto"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {notes}
                  </div>
                </motion.div>
              )}

              {/* Recording Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-6"
                  >
                    <Square className="w-5 h-5 mr-2 fill-white" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    {isPaused ? (
                      <Button
                        onClick={resumeRecording}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-6"
                      >
                        <Play className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseRecording}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-6"
                      >
                        <Pause className="w-5 h-5" />
                      </Button>
                    )}
                    <Button
                      onClick={stopRecording}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-6"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                  </>
                )}

                <Button
                  onClick={() => setShowNotes(!showNotes)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-6 py-6"
                >
                  {showNotes ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>

                {recordedChunks.length > 0 && (
                  <Button
                    onClick={downloadRecording}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-6"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notes Editor Sidebar */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-full lg:w-96 bg-zinc-900 border-l border-white/10 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes & Settings
                </h2>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Your Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter your script or talking points here..."
                    className="bg-white/5 border-white/10 text-white min-h-[200px] resize-none"
                  />
                  <p className="text-xs text-white/40 mt-2">
                    These notes will appear on screen while recording
                  </p>
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">Notes Position</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setNotesPosition("top")}
                      variant={notesPosition === "top" ? "default" : "outline"}
                      className={notesPosition === "top" ? "bg-white/20" : "border-white/20"}
                    >
                      Top
                    </Button>
                    <Button
                      onClick={() => setNotesPosition("bottom")}
                      variant={notesPosition === "bottom" ? "default" : "outline"}
                      className={notesPosition === "bottom" ? "bg-white/20" : "border-white/20"}
                    >
                      Bottom
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">
                    Font Size: {fontSize}px
                  </label>
                  <Input
                    type="range"
                    min="16"
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-2 block">
                    Notes Opacity: {Math.round(notesOpacity * 100)}%
                  </label>
                  <Input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.1"
                    value={notesOpacity}
                    onChange={(e) => setNotesOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white/70 mb-3">Tips</h3>
                  <ul className="space-y-2 text-xs text-white/50">
                    <li>• Write short, easy-to-read sentences</li>
                    <li>• Use bullet points for key talking points</li>
                    <li>• Adjust font size for comfortable reading</li>
                    <li>• Toggle notes visibility during recording</li>
                    <li>• Recordings are saved as WebM format</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}