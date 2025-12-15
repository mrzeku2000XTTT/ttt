import React, { useEffect, useRef } from 'react';

const ElementalVisualizer = ({ activeElement, powerHandEnabled }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current = { 
          x: e.clientX - rect.left, 
          y: e.clientY - rect.top 
        };
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on base
    let animationFrameId;
    let particles = [];
    let backgroundTime = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // --- Background Generators ---
    const drawMagmaBackground = (ctx, time) => {
      const w = canvas.width;
      const h = canvas.height;
      
      // Deep pulsating red/black base
      const pulse = Math.sin(time * 0.001) * 0.1 + 0.9;
      ctx.fillStyle = '#0f0202';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      
      // Turbulent Lava Flows
      for (let i = 0; i < 5; i++) {
        const t = time * 0.0008 + i * 100;
        // Lissajous-like movement for chaotic flow
        const x = w/2 + Math.sin(t * 0.7) * (w * 0.5) + Math.cos(t * 0.3) * (w * 0.2);
        const y = h/2 + Math.cos(t * 0.8) * (h * 0.5) + Math.sin(t * 0.5) * (h * 0.2);
        const r = Math.max(w, h) * (0.4 + Math.sin(t) * 0.1);
        
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        // Intense core colors
        grad.addColorStop(0, `rgba(255, ${100 + Math.sin(t*2)*50}, 0, 0.3)`); 
        grad.addColorStop(0.4, 'rgba(200, 20, 0, 0.1)');
        grad.addColorStop(1, 'rgba(50, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      
      // Cracking effect (random lines)
      if (Math.random() > 0.8) {
          ctx.strokeStyle = `rgba(255, 200, 100, ${Math.random() * 0.2})`;
          ctx.lineWidth = Math.random() * 2 + 1;
          ctx.beginPath();
          const startX = Math.random() * w;
          const startY = Math.random() * h;
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + (Math.random()-0.5)*100, startY + (Math.random()-0.5)*100);
          ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    const drawIonBackground = (ctx, time) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#020510';
        ctx.fillRect(0, 0, w, h);
  
        ctx.globalCompositeOperation = 'screen'; // Use screen for cleaner blue glow
        
        // Ion streams
        for (let i = 0; i < 6; i++) {
          const t = time * 0.001 + i;
          const x = w/2 + Math.sin(t) * (w * 0.6);
          const y = h/2 + Math.cos(t * 0.9) * (h * 0.6);
          const r = Math.max(w, h) * 0.4;
  
          const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
          grad.addColorStop(0, `rgba(100, 200, 255, 0.15)`);
          grad.addColorStop(0.5, `rgba(50, 100, 255, 0.05)`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }

        // Electric arcs
        if (Math.random() > 0.92) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(200, 240, 255, ${Math.random() * 0.5})`;
            ctx.lineWidth = Math.random() * 3;
            ctx.beginPath();
            let lx = Math.random() * w;
            let ly = Math.random() * h;
            ctx.moveTo(lx, ly);
            for(let k=0; k<5; k++) {
                lx += (Math.random()-0.5) * 100;
                ly += (Math.random()-0.5) * 100;
                ctx.lineTo(lx, ly);
            }
            ctx.stroke();
        }
        
        ctx.globalCompositeOperation = 'source-over';
    };
    
    const drawEarthBackground = (ctx, time) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(0, 0, w, h);
        
        // Floating spores feel
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 2; i++) {
            const t = time * 0.0002 + i * 10;
            const y = (t * 50) % h;
            const grad = ctx.createLinearGradient(0, y, 0, y + h);
            grad.addColorStop(0, 'rgba(20, 50, 20, 0.0)');
            grad.addColorStop(0.5, 'rgba(40, 100, 40, 0.1)');
            grad.addColorStop(1, 'rgba(20, 50, 20, 0.0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
    };
    
    const drawLightningBackground = (ctx, time) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#0a0a0a'; // Dark grey
        ctx.fillRect(0, 0, w, h);
        
        // Random flashes
        if (Math.random() > 0.96) {
             ctx.fillStyle = `rgba(200, 200, 255, ${Math.random() * 0.1})`;
             ctx.fillRect(0,0,w,h);
        }
    };

    // --- Particle System ---
    class Particle {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        
        // Velocity randomness
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        
        this.vx = Math.cos(angle) * speed * 0.5;
        this.vy = Math.sin(angle) * speed * 0.5;
        
        if (type === 'fire') {
            this.vy -= Math.random() * 3 + 1; // Upward bias
            this.vx *= 0.5;
            this.size = Math.random() * 15 + 5;
            this.decay = Math.random() * 0.02 + 0.01;
        } else if (type === 'water') {
            this.vy -= Math.random() * 2 + 0.5;
            this.size = Math.random() * 8 + 2;
            this.decay = Math.random() * 0.01 + 0.005;
        } else if (type === 'earth') {
            this.vy += Math.random() * 1 + 0.5; // Gravity
            this.size = Math.random() * 6 + 2;
            this.decay = Math.random() * 0.01 + 0.005;
        } else if (type === 'lightning') {
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10;
            this.size = Math.random() * 3 + 1;
            this.decay = Math.random() * 0.1 + 0.05;
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;

        if (this.type === 'fire') {
            this.size *= 0.96; // Shrink as it burns
            this.vx += (Math.random() - 0.5) * 0.5; // Turbulent jitter
        } else if (this.type === 'earth') {
             this.x += Math.sin(this.y * 0.05) * 0.5; // Wiggle fall
        }
      }

      draw(ctx) {
        if (this.life <= 0) return;
        
        const x = this.x;
        const y = this.y;
        
        if (this.type === 'fire') {
            // Magma Gradient: White -> Yellow -> Orange -> Red -> Dark
            // Life goes 1.0 -> 0.0
            const alpha = this.life;
            let color;
            
            if (this.life > 0.8) {
                color = `rgba(255, 255, 200, ${alpha})`; // White/Yellow hot center
            } else if (this.life > 0.5) {
                color = `rgba(255, 150, 0, ${alpha})`; // Orange
            } else if (this.life > 0.2) {
                color = `rgba(200, 50, 0, ${alpha * 0.8})`; // Red
            } else {
                color = `rgba(50, 50, 50, ${alpha * 0.5})`; // Smoke
            }
            
            ctx.globalCompositeOperation = 'lighter'; // Additive blending makes it glow
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'water') {
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(100, 200, 255, ${this.life * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, this.size, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = `rgba(255, 255, 255, ${this.life * 0.8})`;
            ctx.beginPath();
            ctx.arc(x - this.size * 0.3, y - this.size * 0.3, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'earth') {
             ctx.globalCompositeOperation = 'source-over';
             ctx.fillStyle = `rgba(100, 200, 100, ${this.life})`;
             ctx.beginPath();
             ctx.arc(x, y, this.size, 0, Math.PI * 2);
             ctx.fill();
        } else if (this.type === 'lightning') {
             ctx.globalCompositeOperation = 'lighter';
             ctx.fillStyle = `rgba(200, 220, 255, ${this.life})`;
             ctx.beginPath();
             ctx.arc(x, y, this.size * 2, 0, Math.PI * 2);
             ctx.fill();
        }
      }
    }

    const render = (time) => {
      backgroundTime = time;
      
      // 1. Draw Background
      if (activeElement === 'fire') drawMagmaBackground(ctx, time);
      else if (activeElement === 'water') drawIonBackground(ctx, time); // Blueish ion
      else if (activeElement === 'earth') drawEarthBackground(ctx, time);
      else if (activeElement === 'lightning') drawLightningBackground(ctx, time);
      else {
          // Default void
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Emit Particles from Power Hand
      if (powerHandEnabled && activeElement) {
        // Emit more particles for fire to make it dense
        const count = activeElement === 'fire' ? 8 : 4;
        for (let i = 0; i < count; i++) {
            // Random offset for spray effect
            const offset = activeElement === 'fire' ? 10 : 2;
            const rx = (Math.random() - 0.5) * offset;
            const ry = (Math.random() - 0.5) * offset;
            particles.push(new Particle(mouseRef.current.x + rx, mouseRef.current.y + ry, activeElement));
        }
      }

      // 3. Ambient Particles (Background activity)
      if (activeElement) {
          if (activeElement === 'fire') {
             // Rising sparks from bottom
             if (Math.random() > 0.5) {
                 const x = Math.random() * canvas.width;
                 particles.push(new Particle(x, canvas.height, 'fire'));
             }
          }
      }

      // 4. Update & Draw Particles
      // Optimization: use a loop backwards to splice safely
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      ctx.globalCompositeOperation = 'source-over'; // Reset
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeElement, powerHandEnabled]); // mouseRef is stable, not needed in deps

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default ElementalVisualizer;