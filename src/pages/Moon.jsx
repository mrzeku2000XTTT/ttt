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
  const [stage, setStage] = useState("draft"); // draft, script, review_script, generating_images, review_storyboard, generating_voice, completed
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
        toast.success("✅ Script generated! Review and approve to continue");
        setStage("review_script");
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
    setStage("generating_images");

    try {
      const result = await base44.functions.invoke("moonGenerateImages", {
        scenes: currentVideo.storyboard,
        brand_colors: currentVideo.brand_colors
      });

      const responseData = result.data;

      if (responseData && responseData.success) {
        const updated = await base44.entities.MoonVideo.update(currentVideo.id, {
          storyboard: responseData.scenes,
          status: "images_generated"
        });

        setCurrentVideo(updated);
        toast.success("🎨 Storyboard visualized! Review and approve");
        setStage("review_storyboard");
      } else {
        throw new Error(responseData?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Failed to generate images: " + error.message);
      setStage("review_script");
    } finally {
      setLoading(false);
    }
  };

  const generateVoice = async () => {
    if (!currentVideo) return;

    setLoading(true);
    setStage("generating_voice");

    try {
      const result = await base44.functions.invoke("moonGenerateVoice", {
        storyboard: currentVideo.storyboard
      });

      const responseData = result.data;

      if (responseData && responseData.success) {
        const updated = await base44.entities.MoonVideo.update(currentVideo.id, {
          storyboard: responseData.scenes,
          status: "voice_generated"
        });

        setCurrentVideo(updated);
        toast.success("🎬 Voiceover complete! Ready to export");
        setStage("completed");
      } else {
        throw new Error(responseData?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Voice generation error:", error);
      toast.error("Failed to generate voice: " + error.message);
      setStage("review_storyboard");
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
    if (video.status === "script_generated") setStage("review_script");
    else if (video.status === "images_generated") setStage("review_storyboard");
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{currentVideo.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {stage === "review_script" && "📝 Review Script"}
                    {stage === "generating_images" && "🎨 Generating Visuals..."}
                    {stage === "review_storyboard" && "🖼️ Review Storyboard"}
                    {stage === "generating_voice" && "🎤 Generating Voice..."}
                    {stage === "completed" && "✅ Video Complete"}
                  </p>
                </div>
                <Button onClick={startNewVideo} variant="outline" size="sm">
                  New Video
                </Button>
              </div>
              <div className="flex gap-2">
                {[
                  { key: "script", label: "Script" },
                  { key: "storyboard", label: "Storyboard" },
                  { key: "graphics", label: "Graphics" },
                  { key: "voice", label: "Voice" },
                  { key: "video", label: "Video" }
                ].map((s, idx) => {
                  const isActive = 
                    (idx === 0 && (stage.includes("script") || stage !== "draft")) ||
                    (idx === 1 && (stage.includes("storyboard") || stage.includes("voice") || stage === "completed")) ||
                    (idx === 2 && (stage.includes("storyboard") || stage.includes("voice") || stage === "completed")) ||
                    (idx === 3 && (stage.includes("voice") || stage === "completed")) ||
                    (idx === 4 && stage === "completed");
                  
                  return (
                    <div key={s.key} className="flex-1">
                      <div className={`h-2 rounded-full ${isActive ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-gray-700"}`} />
                      <p className="text-[10px] text-gray-500 mt-1 text-center">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 1: Review Script */}
            {stage === "review_script" && (
              <Card className="bg-gray-900/50 border-gray-800 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Edit2 className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-bold">Step 1: Review Your Script</h3>
                </div>
                <div className="bg-black/50 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{currentVideo.script}</p>
                </div>
                <div className="flex gap-4 justify-end">
                  <Button variant="outline" onClick={startNewVideo}>
                    ← Back to Edit
                  </Button>
                  <Button 
                    onClick={generateImages}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Approve & Generate Storyboard →"
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Generating Images */}
            {stage === "generating_images" && (
              <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
                <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-2xl font-bold mb-2">Creating Your Storyboard...</h3>
                <p className="text-gray-400">AI is generating visuals for each scene</p>
              </Card>
            )}

            {/* Step 3: Review Storyboard */}
            {stage === "review_storyboard" && (
              <Card className="bg-gray-900/50 border-gray-800 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <ImageIcon className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-bold">Step 2: Review Your Storyboard</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-[500px] overflow-y-auto">
                  {currentVideo.storyboard.map((scene, idx) => (
                    <div key={idx} className="bg-black/50 rounded-lg p-4">
                      <div className="aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden">
                        {scene.image_url ? (
                          <img src={scene.image_url} alt={`Scene ${scene.scene_number}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-cyan-400 mb-2">Scene {scene.scene_number} • {scene.duration}s</p>
                      <p className="text-sm text-gray-300">{scene.description}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 justify-end">
                  <Button variant="outline" onClick={() => setStage("review_script")}>
                    ← Back to Script
                  </Button>
                  <Button 
                    onClick={generateVoice}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Approve & Generate Voice →"
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 4: Generating Voice */}
            {stage === "generating_voice" && (
              <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
                <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-2xl font-bold mb-2">Generating Professional Voiceover...</h3>
                <p className="text-gray-400">Adding voice and finishing touches</p>
              </Card>
            )}

            {/* Step 5: Completion */}
            {stage === "completed" && (
              <Card className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500 p-8">
                <div className="text-center mb-8">
                  <Video className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold mb-2">🎉 Your Video is Ready!</h3>
                  <p className="text-gray-400">Professional explainer video generated in minutes</p>
                </div>

                {/* Preview */}
                <div className="bg-black/50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-bold mb-4">Preview</h4>
                  
                  {/* Storyboard Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {currentVideo.storyboard.slice(0, 4).map((scene, idx) => (
                      <div key={idx} className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        {scene.image_url && (
                          <img src={scene.image_url} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Audio Players */}
                  <div className="space-y-3">
                    <h5 className="text-sm text-gray-400 mb-2">Scene Voiceovers</h5>
                    {currentVideo.storyboard.filter(s => s.voice_url).map((scene, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs text-cyan-400 mb-2">Scene {scene.scene_number}</p>
                        <audio controls src={scene.voice_url} className="w-full h-8" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </Button>
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Full Preview
                  </Button>
                  <Button variant="outline" onClick={startNewVideo}>
                    Create Another
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