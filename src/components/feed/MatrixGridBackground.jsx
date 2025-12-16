import React, { useEffect, useRef } from 'react';

const MatrixGridBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Matrix Rain Configuration
    const characters = '01';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops = new Array(columns).fill(1);

    // Grid Configuration
    let gridOffset = 0;
    const gridSize = 40;
    const speed = 2;

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0F0'; // Matrix Green
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const drawGrid = () => {
      // Perspective Grid
      // We'll draw lines radiating from center and horizontal lines moving down
      const cx = width / 2;
      const cy = height / 2;
      
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.lineWidth = 1;
      
      // Vertical(ish) lines (perspective)
      // Vanishing point is center
      const numVLines = 20;
      for (let i = 0; i <= numVLines; i++) {
          const x = (width / numVLines) * i;
          // Simple lines from vanishing point to bottom
          // Actually let's do a floor grid
          // Vanishing point at cy
          
          // Floor lines (radiating)
          // To make it look like a floor, we draw from cy to bottom edge
          // x at bottom edge varies
          
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          // Spread x at bottom
          const bottomX = (x - cx) * 4 + cx; 
          ctx.lineTo(bottomX, height);
          ctx.stroke();
      }

      // Horizontal lines (moving forward)
      // y increases exponentially as it gets closer
      gridOffset = (gridOffset + speed) % gridSize;
      
      for (let i = 0; i < height / 2; i += 5) { // Optimization: don't draw every pixel
          // We map 'i' (linear distance in 3d space) to screen y
          // y = h / (z)
          // This is a bit complex for a quick 2d canvas, let's fake it with exponential spacing
      }
      
      // Simplified "Tron" floor
      // Horizontal lines
      const horizon = cy;
      for (let z = 0; z < 2000; z += 100) {
          const zPos = z - gridOffset * 5; // Move towards camera
          if (zPos < 10) continue;
          
          // Perspective projection
          const scale = 200 / zPos;
          const y = horizon + (100 * scale); // 100 is camera height
          
          if (y > height) continue;
          if (y < horizon) continue;

          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
      }
    };
    
    // Improved Grid (Retro Style)
    const drawRetroGrid = () => {
        const horizon = height / 2;
        const fov = 300;
        
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1.5;

        gridOffset = (gridOffset + 0.5) % 20; // Movement speed

        // Horizontal lines
        for (let i = 0; i < 20; i++) {
            // Non-linear spacing for depth
            const z = i + (gridOffset / 20); // 0 to 20
            const y = horizon + (fov / (z || 0.1)) * 2; // Simple projection
            
            if (y > height) continue;
            if (y < horizon) continue;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical lines
        for (let i = -20; i <= 20; i++) {
            const xOffset = i * 100;
            // Project top and bottom points
            // Top is at horizon (infinity)
            const x1 = width/2; 
            const y1 = horizon;
            
            // Bottom is near camera
            const x2 = width/2 + xOffset * 2; // Spread out
            const y2 = height;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    let animationFrame;
    const render = () => {
      // Matrix background
      drawMatrix();
      
      // Grid overlay
      drawRetroGrid();
      
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[5] pointer-events-none mix-blend-screen"
      style={{ opacity: 0.8 }}
    />
  );
};

export default MatrixGridBackground;