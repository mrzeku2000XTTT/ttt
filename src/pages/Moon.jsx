import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Video, Mic, Image as ImageIcon, Play, Download, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

export default function Moon() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(30);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("draft"); // draft, script, storyboard, images, voice, video
  const [myVideos, setMyVideos] = useState([]);
  const [brandColors, setBrandColors] = useState(["#06B6D4", "#0891B2", "#0E7490"]);
  const [voiceId, setVoiceId] = useState("EXAVITQu4vr4xnSDxMaL");

  useEffect(() => {
    loadUser();
    loadMyVideos();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      toast.error("Please log in to use Moon");
    }
  };

  const loadMyVideos = async () => {
    try {
      const videos = await base44.entities.MoonVideo.list("-created_date", 10);
      setMyVideos(videos);
    } catch (err) {
      console.error("Failed to load videos:", err);
    }
  };

  const generateScript = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setStage("script");

    try {
      const result = await base44.functions.invoke("moonGenerateScript", {
        prompt,
        duration
      });

      const responseData = result.data;

      if (responseData && responseData.success) {
        const video = await base44.entities.MoonVideo.create({
          title: responseData.title,
          prompt,
          script: responseData.script,
          storyboard: responseData.scenes,
          status: "script_generated",
          duration,
          brand_colors: brandColors,
          voice_id: voiceId
        });

        setCurrentVideo(video);
        toast.success("Script generated! Generating images next...");
        setStage("storyboard");
        
        // Auto-generate images after script
        setTimeout(() => {
          generateImages();
        }, 1000);
      } else {
        throw new Error(responseData?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Script generation error:", error);
      toast.error("Failed to generate script: " + error.message);
      setStage("draft");
    } finally {
      setLoading(false);
    }
  };

  const generateImages = async () => {
    if (!currentVideo) return;

    setLoading(true);
    setStage("images");

    try {
      const result = await base44.functions.invoke("moonGenerateImages", {
        scenes: currentVideo.storyboard,
        brand_colors: currentVideo.brand_colors
      });

      if (result.data.success) {
        const updated = await base44.entities.MoonVideo.update(currentVideo.id, {
          storyboard: result.data.scenes,
          status: "images_generated"
        });

        setCurrentVideo(updated);
        toast.success("Images generated!");
        setStage("voice");
      } else {
        throw new Error(result.data.error);
      }
    } catch (error) {
      toast.error("Failed to generate images: " + error.message);
      setStage("storyboard");
    } finally {
      setLoading(false);
    }
  };

  const generateVoice = async () => {
    if (!currentVideo) return;

    setLoading(true);
    setStage("voice");

    try {
      const result = await base44.functions.invoke("moonGenerateVoice", {
        script: currentVideo.script,
        voice_id: currentVideo.voice_id
      });

      if (result.data.success) {
        const updated = await base44.entities.MoonVideo.update(currentVideo.id, {
          voice_url: result.data.voice_url,
          status: "voice_generated"
        });

        setCurrentVideo(updated);
        toast.success("Voiceover generated!");
        setStage("completed");
      } else {
        throw new Error(result.data.error);
      }
    } catch (error) {
      toast.error("Failed to generate voice: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startNewVideo = () => {
    setCurrentVideo(null);
    setPrompt("");
    setStage("draft");
  };

  const loadVideo = (video) => {
    setCurrentVideo(video);
    setPrompt(video.prompt);
    if (video.status === "script_generated") setStage("storyboard");
    else if (video.status === "images_generated") setStage("voice");
    else if (video.status === "voice_generated") setStage("completed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              MOON
            </h1>
          </div>
          <p className="text-gray-400 text-lg">AI Video Generation Studio</p>
        </div>

        {/* Main Content */}
        {!currentVideo ? (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-800 p-8">
              <h2 className="text-2xl font-bold mb-6">Create Your Video</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">What's your video about?</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your product, idea, or message..."
                    className="bg-black/50 border-gray-700 text-white h-32"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Video Duration (seconds)</label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="bg-black/50 border-gray-700 text-white"
                    min="15"
                    max="120"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Brand Colors</label>
                  <div className="flex gap-2">
                    {brandColors.map((color, idx) => (
                      <input
                        key={idx}
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...brandColors];
                          newColors[idx] = e.target.value;
                          setBrandColors(newColors);
                        }}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={generateScript}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Video
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* My Videos */}
            {myVideos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">My Videos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myVideos.map((video) => (
                    <Card
                      key={video.id}
                      onClick={() => loadVideo(video)}
                      className="bg-gray-900/50 border-gray-800 p-4 cursor-pointer hover:border-cyan-500 transition-colors"
                    >
                      <h4 className="font-bold mb-2">{video.title}</h4>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">{video.prompt}</p>
                      <Badge variant="outline">{video.status.replace(/_/g, " ")}</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <Button onClick={startNewVideo} variant="outline" size="sm">
                  New Video
                </Button>
              </div>
              <div className="flex gap-2">
                {["script", "storyboard", "images", "voice", "completed"].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-2 rounded-full ${
                      stage === s || myVideos.find(v => v.id === currentVideo.id)?.status.includes(s)
                        ? "bg-cyan-500"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Script */}
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Edit2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-bold">Script</h3>
                </div>
                <div className="bg-black/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-gray-300 whitespace-pre-wrap">{currentVideo.script}</p>
                </div>
              </Card>

              {/* Storyboard */}
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xl font-bold">Storyboard</h3>
                  </div>
                  {stage === "storyboard" && !loading && (
                    <Button onClick={generateImages} size="sm">
                      Generate Images
                    </Button>
                  )}
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {currentVideo.storyboard.map((scene, idx) => (
                    <div key={idx} className="bg-black/50 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          {scene.image_url ? (
                            <img src={scene.image_url} alt={`Scene ${scene.scene_number}`} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">Scene {scene.scene_number}</p>
                          <p className="text-sm text-gray-300">{scene.description}</p>
                          <p className="text-xs text-cyan-400 mt-2">{scene.duration}s</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Voice & Video Controls */}
            <Card className="bg-gray-900/50 border-gray-800 p-6 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Mic className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h3 className="font-bold">Voiceover & Audio</h3>
                    {currentVideo.voice_url && (
                      <audio controls src={currentVideo.voice_url} className="mt-2" />
                    )}
                  </div>
                </div>
                {stage === "voice" && !loading && !currentVideo.voice_url && (
                  <Button onClick={generateVoice}>
                    <Mic className="w-4 h-4 mr-2" />
                    Generate Voice
                  </Button>
                )}
                {loading && stage === "voice" && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating voiceover...
                  </div>
                )}
              </div>
            </Card>

            {/* Completion */}
            {stage === "completed" && (
              <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500 p-8 mt-6 text-center">
                <Video className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Video Ready!</h3>
                <p className="text-gray-400 mb-6">Your AI-generated video is complete</p>
                <div className="flex gap-4 justify-center">
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}