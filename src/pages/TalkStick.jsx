import React from "react";
import BackToStore from "@/components/BackToStore";
import TalkStickStudio from "@/components/talkstick/TalkStickStudio";
import "@/components/talkstick/talkstick.css";

export default function TalkStickPage() {
  return (
    <>
      <BackToStore />
      <TalkStickStudio />
    </>
  );
}