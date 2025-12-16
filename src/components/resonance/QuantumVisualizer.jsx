import React, { useEffect, useRef } from 'react';

const QuantumVisualizer = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let w, h;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const lines = [];
    const numLines = 100;
    
    for (let i = 0; i < numLines; i++) {
        lines.push({
            x: Math.random() * w,
            y: Math.random() * h,
            z: Math.random() * 2 + 0.5, // Depth/Speed
            angle: Math.random() * Math.PI * 2,
            length: Math.random() * 200 + 50
        });
    }

    const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
        ctx.fillRect(0, 0, w, h);

        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        
        // Calculate center offset based on mouse
        const cx = w / 2;
        const cy = h / 2;
        const dx = (mx - cx) * 0.05;
        const dy = (my - cy) * 0.05;

        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1;
        ctx.globalCompositeOperation = 'lighter';

        const time = Date.now() * 0.001;

        lines.forEach((line, i) => {
            // Move lines "towards" the viewer or quantum center
            line.z += 0.01;
            if (line.z > 3) line.z = 0.5;

            // Perspective projection
            const perspective = 500 / (500 - (line.z * 100)); // Simple depth
            
            // Warp based on mouse
            const distX = line.x - mx;
            const distY = line.y - my;
            const dist = Math.sqrt(distX * distX + distY * distY);
            
            // Quantum distortion
            const angle = Math.atan2(distY, distX) + (dist * 0.002) + time;
            const radius = dist * (0.8 + Math.sin(time * 2 + i) * 0.1);

            const x1 = mx + Math.cos(angle) * radius;
            const y1 = my + Math.sin(angle) * radius;
            
            const x2 = mx + Math.cos(angle) * (radius + line.length * perspective);
            const y2 = my + Math.sin(angle) * (radius + line.length * perspective);

            // Color based on angle/speed
            const hue = (time * 50 + dist * 0.5) % 360;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${1 - line.z/3})`;
            ctx.lineWidth = Math.max(0.5, 2 * perspective);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Grid effect lines
            if (i % 5 === 0) {
                 ctx.beginPath();
                 ctx.moveTo(0, h/2 + (i - numLines/2)*20 + dy*10);
                 ctx.lineTo(w, h/2 + (i - numLines/2)*20 - dy*10);
                 ctx.strokeStyle = `rgba(100, 200, 255, 0.05)`;
                 ctx.stroke();
            }
        });
        
        ctx.globalCompositeOperation = 'source-over';
        frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black opacity-60" />
      <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.8) 100%)'
      }} />
    </div>
  );
};

export default QuantumVisualizer;