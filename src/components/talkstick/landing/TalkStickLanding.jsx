import React from "react";
import { Link } from "react-router-dom";
import BackToStore from "@/components/BackToStore";
import TalkStickLandingHero from "./TalkStickLandingHero";
import {
  TalkStickFeatures,
  TalkStickFooter,
  TalkStickMakes,
  TalkStickWorkflow,
} from "./TalkStickLandingSections";
import "./talkstickLanding.css";

/** The front door for TALKSTICK — the studio lives at /TalkStickStudio. */
export default function TalkStickLanding() {
  return (
    <div className="tsl">
      <BackToStore />

      <header className="tsl-head">
        <Link to="/TalkStick" className="tsl-mark">
          TS
        </Link>
        <div className="tsl-head-text">
          <span className="tsl-name">TALKSTICK</span>
          <span className="tsl-tag">Real-time talking characters</span>
        </div>

        <nav className="tsl-nav">
          <a href="#how">How it works</a>
          <a href="#makes">What it makes</a>
        </nav>

        <div className="tsl-head-actions">
          <Link to="/AppStoreV2" className="tsl-ghost">
            Store
          </Link>
          <Link to="/TalkStickStudio" className="tsl-solid">
            Open studio
          </Link>
        </div>
      </header>

      <TalkStickLandingHero />
      <TalkStickFeatures />
      <TalkStickWorkflow />
      <TalkStickMakes />
      <TalkStickFooter />
    </div>
  );
}