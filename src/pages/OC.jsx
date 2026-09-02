import React from "react";
import { useMotionEditor } from "@/components/oc/useMotionEditor";
import Toolbar from "@/components/oc/Toolbar";
import Stage from "@/components/oc/Stage";
import Timeline from "@/components/oc/Timeline";
import Inspector from "@/components/oc/Inspector";

export default function OCPage() {
  const editor = useMotionEditor();
  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f5f7]" style={{ fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif' }}>
      <Toolbar editor={editor} />
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <Stage editor={editor} />
        <Inspector editor={editor} />
      </div>
      <Timeline editor={editor} />
    </div>
  );
}