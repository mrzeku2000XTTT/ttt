import React from 'react';
import { Bot, ImagePlus, Loader2, Send } from 'lucide-react';

export default function ETAAgentBrief({ brief, onChange, files, onFiles, onGenerate, loading, status, elapsed, error }) {
  const set = (key) => (event) => onChange({ ...brief, [key]: event.target.value });
  return <form onSubmit={onGenerate} className="eta-agent-form">
    <div className="eta-agent-top"><span><Bot className="h-4 w-4" /></span><div><b>ETA Director</b><p>Hyperframes motion agent</p></div><i>ONLINE</i></div>
    <div className="eta-agent-thread"><div className="eta-agent-bubble"><Bot className="h-4 w-4" /><p>Tell me what you are launching. I’ll direct the scenes, UI motion, pacing, and Remotion timeline.</p></div></div>
    <div className="eta-agent-meta"><input className="eta-director-input" value={brief.name} onChange={set('name')} placeholder="Product name" required /><input className="eta-director-input" value={brief.url} onChange={set('url')} placeholder="Product link (optional)" type="url" /></div>
    <div className="eta-agent-composer"><textarea value={brief.description} onChange={set('description')} placeholder="Describe the product, key features, and the animation you want ETA to create…" required /><div className="eta-agent-tools"><label title="Add visual references"><ImagePlus className="h-4 w-4" /><span>{files.length || 'Add references'}</span><input className="hidden" type="file" accept="image/*" multiple onChange={(e) => onFiles(Array.from(e.target.files || []))} /></label><button disabled={loading} title="Send brief to ETA">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></div>
    <div className="eta-agent-options"><input className="eta-director-input" value={brief.audience} onChange={set('audience')} placeholder="Audience" required /><input className="eta-director-input" value={brief.style} onChange={set('style')} placeholder="Motion style" required /><select className="eta-director-input" value={brief.duration} onChange={set('duration')}><option value="15">15 sec</option><option value="25">25 sec</option><option value="30">30 sec</option><option value="60">60 sec</option></select><select className="eta-director-input" value={brief.format} onChange={set('format')}><option>16:9 landscape</option><option>9:16 vertical</option><option>1:1 square</option></select></div>
    {loading && <p className="eta-agent-status">{status} · {elapsed}s</p>}{error && <p className="eta-director-error">{error}</p>}
  </form>;
}