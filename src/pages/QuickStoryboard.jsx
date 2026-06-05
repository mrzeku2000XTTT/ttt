import React from "react";
import { useNavigate } from "react-router-dom";
import StoryboardStudio from "@/components/storyboard/StoryboardStudio";

export default function QuickStoryboardPage() {
  const navigate = useNavigate();
  return <StoryboardStudio onClose={() => navigate("/AppStoreV2")} />;
}