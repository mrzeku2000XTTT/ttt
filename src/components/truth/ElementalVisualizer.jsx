import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const ElementalVisualizer = ({ activeElement, powerHandEnabled }) => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let flashes = []; // For lightning

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 3 + 1;

        if (type === 'fire') {
          this.vy = -Math.random() * 3 - 1; // Move up
          this.color = `hsl(${Math.random() * 40 + 10}, 100%, 50%)`;
        } else if (type === 'water') {
          this.vy = -Math.random() * 1 - 0.5; // Bubble up slowly
          this.color = `hsl(${Math.random() * 40 + 200}, 100%, 50%)`;
        } else if (type === 'earth') {
          this.vy = Math.random() * 2 + 1; // Fall down
          this.color = `hsl(${Math.random() * 40 + 100}, 60%, 40%)`;
          this.size = Math.random() * 5 + 2;
        } else if (type === 'lightning') {
            this.color = `hsl(${Math.random() * 20 + 260}, 100%, 80%)`;
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10;
            this.life = 0.5; // Short life
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.01;

        if (this.type === 'fire') {
            this.size *= 0.95;
        } else if (this.type === 'lightning') {
            this.life -= 0.05;
        }
      }

      draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    const createLightning = () => {
        if (Math.random() > 0.95) { // Random chance of lightning
            const startX = Math.random() * canvas.width;
            flashes.push({
                x: startX,
                life: 1.0,
                segments: []
            });
        }
    };

    const drawLightning = (ctx) => {
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'white';
        
        flashes.forEach((flash, index) => {
            if (flash.segments.length === 0) {
                let currX = flash.x;
                let currY = 0;
                while (currY < canvas.height) {
                    const nextX = currX + (Math.random() - 0.5) * 100;
                    const nextY = currY + Math.random() * 50 + 20;
                    flash.segments.push({x1: currX, y1: currY, x2: nextX, y2: nextY});
                    currX = nextX;
                    currY = nextY;
                }
            }

            ctx.globalAlpha = flash.life;
            ctx.beginPath();
            flash.segments.forEach(seg => {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            });
            ctx.stroke();
            
            flash.life -= Math.random() * 0.1 + 0.05;
            if (flash.life <= 0) flashes.splice(index, 1);
        });
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }


    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Ambient Background
      let gradient;
      if (activeElement === 'fire') {
        gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, canvas.width);
        gradient.addColorStop(0, 'rgba(50, 10, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(20, 0, 0, 0.8)');
      } else if (activeElement === 'water') {
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 10, 30, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 30, 60, 0.2)');
      } else if (activeElement === 'earth') {
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(10, 20, 10, 0.8)');
        gradient.addColorStop(1, 'rgba(30, 40, 20, 0.8)');
      } else if (activeElement === 'lightning') {
        gradient = ctx.createRadialGradient(canvas.width/2, 0, 0, canvas.width/2, canvas.height/2, canvas.height);
        gradient.addColorStop(0, 'rgba(20, 20, 40, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 10, 0.9)');
      } else {
        gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, canvas.width);
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mouse Power Hand
      if (powerHandEnabled) {
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(mousePos.x, mousePos.y, activeElement || 'fire'));
        }
      }

      // Ambient Particles
      if (activeElement) {
        if (Math.random() > 0.8) {
             const x = Math.random() * canvas.width;
             const y = activeElement === 'fire' || activeElement === 'water' ? canvas.height : 0;
             particles.push(new Particle(x, y, activeElement));
        }
        
        if (activeElement === 'lightning') {
            createLightning();
            drawLightning(ctx);
        }
      }

      // Update and Draw Particles
      particles.forEach((p, index) => {
        p.update();
        p.draw(ctx);
        if (p.life <= 0) particles.splice(index, 1);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeElement, powerHandEnabled, mousePos]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default ElementalVisualizer;