import React from "react";

/** The drawing surface — click anywhere on the character to place the mouth. */
export default function TalkStickStage({ canvasRef, stageRef, hasImage, onPlace }) {
  const place = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !hasImage) return;
    const rect = canvas.getBoundingClientRect();
    onPlace({
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    });
  };

  return (
    <main className="ts-card">
      <div className="ts-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="ts-canvas" hidden={!hasImage} onClick={place} />
        {!hasImage && (
          <div className="ts-empty">
            <strong>Upload your character</strong>
            <span>Then click directly on its mouth.</span>
          </div>
        )}
      </div>
    </main>
  );
}