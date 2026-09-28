import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Image as ImageIcon,
  Layers,
  Mic,
  MousePointerClick,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

const FEATURES = [
  { icon: MousePointerClick, title: "Click once", body: "The face lands in the head, sized for it." },
  { icon: Mic, title: "Speak or play audio", body: "The mouth follows your voice in real time." },
  { icon: Wand2, title: "Generate props", body: "Any prompt, cut out and dropped in transparent." },
  { icon: Layers, title: "Backgrounds and props", body: "Drag them anywhere on the stage." },
  { icon: Save, title: "Never lose a scene", body: "It saves itself, and you can name copies." },
];

const STEPS = [
  { title: "Pick a character", body: "Upload a drawing or start from one of ten ready-made stickmen." },
  { title: "Place the face", body: "Eyes, nose and mouth drop onto the head and can be dragged and resized." },
  { title: "Dress the scene", body: "Generate a backdrop or a prop, or drag your own images onto the stage." },
  { title: "Make it talk", body: "Use the microphone or an audio file, then export the frame as a transparent PNG." },
];

const MAKES = [
  { icon: ImageIcon, title: "Transparent PNG", body: "The exported frame keeps its alpha, so it drops onto anything.", sample: "talkstick-frame.png" },
  { icon: Mic, title: "Voice-driven mouth", body: "Level is analysed on every frame and smoothed, so it never snaps.", sample: "Live · 60fps" },
  { icon: Wand2, title: "Cut-out props", body: "Generated props are stripped of their white sheet automatically.", sample: "alpha preserved" },
  { icon: Layers, title: "Layered scene", body: "Backdrops sit behind the character, props sit in front.", sample: "2 layers" },
];

export function TalkStickFeatures() {
  return (
    <section className="tsl-bar">
      {FEATURES.map((item) => (
        <div key={item.title} className="tsl-bar-item">
          <item.icon className="tsl-bar-icon" />
          <span className="tsl-bar-title">{item.title}</span>
          <span className="tsl-bar-body">{item.body}</span>
        </div>
      ))}
    </section>
  );
}

export function TalkStickWorkflow() {
  return (
    <section className="tsl-section" id="how">
      <span className="tsl-kicker">How it works</span>
      <h2 className="tsl-h2">Four steps from drawing to talking</h2>
      <p className="tsl-section-sub">No timeline, no keyframes — the face is placed once and animated by sound.</p>

      <div className="tsl-steps">
        {STEPS.map((step, index) => (
          <div key={step.title} className="tsl-step">
            <span className="tsl-step-num">{index + 1}</span>
            <span className="tsl-step-title">{step.title}</span>
            <span className="tsl-step-body">{step.body}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TalkStickMakes() {
  return (
    <section className="tsl-section" id="makes">
      <span className="tsl-kicker">What it makes</span>
      <h2 className="tsl-h2">Everything a talking character needs</h2>
      <p className="tsl-section-sub">One stage, one save file, no account.</p>

      <div className="tsl-cards">
        {MAKES.map((card) => (
          <div key={card.title} className="tsl-card">
            <card.icon className="tsl-card-icon" />
            <span className="tsl-card-title">{card.title}</span>
            <span className="tsl-card-body">{card.body}</span>
            <span className="tsl-card-sample">{card.sample}</span>
          </div>
        ))}

        <div className="tsl-cta">
          <Sparkles className="tsl-cta-icon" />
          <span className="tsl-cta-title">TALKSTICK</span>
          <span className="tsl-cta-body">Give a drawing a voice, in about a minute.</span>
          <Link to="/TalkStickStudio" className="tsl-cta-btn">
            Open the studio
            <ArrowRight className="tsl-cta-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TalkStickFooter() {
  return (
    <footer className="tsl-foot">
      <div className="tsl-foot-left">
        <span className="tsl-mark tsl-mark-sm">TS</span>
        <span className="tsl-foot-text">Built for anyone who draws a character and wants it to speak.</span>
      </div>
      <span className="tsl-foot-note">Your artwork is read and rendered locally — nothing is uploaded.</span>
    </footer>
  );
}