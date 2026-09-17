import React, { useState } from "react";
import FlagSenseLanding from "@/components/flagsense/FlagSenseLanding";
import FlagSenseApp from "@/components/flagsense/FlagSenseApp";

const ENTERED = "flagsense_entered";

/** Route page: landing first (per store convention), then the app on CTA. */
export default function FlagSense() {
  const [entered, setEntered] = useState(() => {
    try { return sessionStorage.getItem(ENTERED) === "1"; } catch { return false; }
  });

  const begin = () => {
    try { sessionStorage.setItem(ENTERED, "1"); } catch {}
    setEntered(true);
  };

  return entered ? <FlagSenseApp /> : <FlagSenseLanding onBegin={begin} />;
}