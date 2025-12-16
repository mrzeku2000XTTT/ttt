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

    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;
    let clouds = []; // Replaces particles with "clouds"
    let backgroundTime = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // --- Modern Cloudy Backgrounds ---
    
    const drawFireBackground = (ctx, time) => {
        const w = canvas.width;
        const h = canvas.height;
        
        // Deep scorched earth base
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0000');
        grad.addColorStop(1, '#1a0500');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Ambient heat haze (using large soft circles)
        ctx.globalCompositeOperation = 'screen';
        const t = time * 0.0005;
        
        for (let i = 0; i < 3; i++) {
            const x = w * 0.5 + Math.sin(t + i) * (w * 0.3);
            const y = h * 0.8 + Math.cos(t * 1.5 + i) * (h * 0.1);
            const r = h * 0.6;
            
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(100, 20, 0, 0.1)');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
    };

    const drawWaterBackground = (ctx, time) => {
        const w = canvas.width;
        const h = canvas.height;
        
        // Deep ocean abyss
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#000510');
        grad.addColorStop(1, '#001020');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Caustics / Underwater light
        ctx.globalCompositeOperation = 'lighter';
        const t = time * 0.0003;
        
        for (let i = 0; i < 3; i++) {
            const x = w * 0.5 + Math.cos(t + i) * (w * 0.4);
            const y = h * 0.4 + Math.sin(t * 0.8 + i) * (h * 0.2);
            const r = h * 0.8;
            
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(0, 50, 100, 0.15)');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
    };

    const drawEarthBackground = (ctx, time) => {
        const w = canvas.width;
        const h = canvas.height;
        
        // Dark forest/cave
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#050a05');
        grad.addColorStop(1, '#0f1a0f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Floating dust/pollen
        ctx.globalCompositeOperation = 'screen';
        const t = time * 0.0002;
        
        for (let i = 0; i < 3; i++) {
            const x = w * 0.5 + Math.sin(t * 0.5 + i) * (w * 0.4);
            const y = h * 0.5 + Math.cos(t * 0.3 + i) * (h * 0.4);
            const r = h * 0.7;
            
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(20, 40, 20, 0.15)');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
    };

    const drawAirBackground = (ctx, time) => {
        const w = canvas.width;
        const h = canvas.height;
        
        // High altitude/Storm
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a1a20');
        grad.addColorStop(1, '#0a0a10');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Flowing wind streams
        ctx.globalCompositeOperation = 'screen';
        const t = time * 0.001;
        
        for (let i = 0; i < 4; i++) {
            const x = w * 0.5 + Math.sin(t + i) * (w * 0.2);
            const y = h * 0.5 + Math.sin(t * 0.5 + i) * (h * 0.3);
            const r = h * 0.5;
            
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, 'rgba(150, 160, 180, 0.08)');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = 'source-over';
    };

    // --- Cloud Sprite Generator ---
    // Instead of small dots, we use large, soft "puffs"
    class Cloud {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Clouds rotate slowly
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;

        if (type === 'fire') {
            this.vy -= Math.random() * 2 + 1; // Rise fast
            this.vx *= 0.3; // Less horizontal
            this.size = Math.random() * 80 + 40; // Large puffs
            this.decay = Math.random() * 0.015 + 0.005;
        } else if (type === 'water') {
            this.vy -= Math.random() * 1 + 0.5; // Rise slow (bubbles/mist)
            this.size = Math.random() * 60 + 30;
            this.decay = Math.random() * 0.008 + 0.002;
        } else if (type === 'earth') {
            this.vy += Math.random() * 1 + 0.5; // Fall (dust/rocks)
            this.size = Math.random() * 50 + 20;
            this.decay = Math.random() * 0.01 + 0.005;
        } else if (type === 'air') {
            this.vx = (Math.random() - 0.5) * 8; // Fast horizontal
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 100 + 50; // Huge wisps
            this.decay = Math.random() * 0.02 + 0.01;
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
        this.size *= 1.01; // Expand as they dissipate

        if (this.type === 'fire') {
            this.vx += (Math.random() - 0.5) * 0.2; // Turbulence
        } else if (this.type === 'air') {
            this.vx *= 1.01; // Accelerate
        }
      }

      draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Soft radial gradient for the cloud puff
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        
        if (this.type === 'fire') {
            // Smoke + Fire core
            // Starts bright orange, fades to dark grey smoke
            const alpha = this.life;
            if (this.life > 0.6) {
                // Fire core
                ctx.globalCompositeOperation = 'lighter';
                grad.addColorStop(0, `rgba(255, 200, 50, ${alpha * 0.5})`);
                grad.addColorStop(0.4, `rgba(200, 50, 0, ${alpha * 0.3})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                // Smoke trail
                ctx.globalCompositeOperation = 'source-over';
                grad.addColorStop(0, `rgba(50, 50, 50, ${alpha * 0.4})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
        } else if (this.type === 'water') {
            // Mist / bubbles
            ctx.globalCompositeOperation = 'screen';
            const alpha = this.life * 0.4;
            grad.addColorStop(0, `rgba(200, 255, 255, ${alpha})`);
            grad.addColorStop(0.5, `rgba(0, 150, 255, ${alpha * 0.5})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (this.type === 'earth') {
            // Dust cloud
            ctx.globalCompositeOperation = 'source-over';
            const alpha = this.life * 0.5;
            grad.addColorStop(0, `rgba(60, 50, 40, ${alpha})`);
            grad.addColorStop(0.6, `rgba(30, 25, 20, ${alpha * 0.5})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (this.type === 'air') {
            // Wind wisp
            ctx.globalCompositeOperation = 'screen';
            const alpha = this.life * 0.15;
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(1, 'rgba(100, 100, 150, 0)');
            // Stretch air clouds
            ctx.scale(2, 0.5); 
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const render = (time) => {
      backgroundTime = time;
      
      // 1. Draw Background
      if (activeElement === 'fire') drawFireBackground(ctx, time);
      else if (activeElement === 'water') drawWaterBackground(ctx, time);
      else if (activeElement === 'earth') drawEarthBackground(ctx, time);
      else if (activeElement === 'air') drawAirBackground(ctx, time);
      else {
          // Default void
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Emit "Clouds" from Power Hand
      if (powerHandEnabled && activeElement) {
        // Emit rate
        const count = 1; // Clouds are big, we need fewer
        for (let i = 0; i < count; i++) {
            const offset = 20;
            const rx = (Math.random() - 0.5) * offset;
            const ry = (Math.random() - 0.5) * offset;
            clouds.push(new Cloud(mouseRef.current.x + rx, mouseRef.current.y + ry, activeElement));
        }
      }

      // 3. Ambient Clouds (Background activity)
      if (activeElement) {
          // Add random ambient clouds for atmosphere
          if (Math.random() > 0.92) {
             const x = Math.random() * canvas.width;
             const y = activeElement === 'fire' || activeElement === 'water' ? canvas.height + 50 : 
                       activeElement === 'earth' ? -50 :
                       Math.random() * canvas.height;
             
             if (activeElement === 'air') {
                 // Air comes from sides
                 clouds.push(new Cloud(-50, Math.random() * canvas.height, 'air'));
             } else {
                 clouds.push(new Cloud(x, y, activeElement));
             }
          }
      }

      // 4. Update & Draw Clouds
      for (let i = clouds.length - 1; i >= 0; i--) {
        const p = clouds[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          clouds.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeElement, powerHandEnabled]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default ElementalVisualizer;