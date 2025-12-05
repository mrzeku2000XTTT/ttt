import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Globe, Users, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function EarthPage() {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Particle class
    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * height;
        this.baseX = this.x;
        this.baseY = this.y;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = -10;
        this.baseX = this.x;
        this.baseY = this.y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = Math.random() * 0.3 + 0.2;
        this.size = Math.random() * 2 + 1;
        this.life = 1;
        this.decay = Math.random() * 0.003 + 0.001;
        this.wave = Math.random() * Math.PI * 2;
        this.waveSpeed = Math.random() * 0.02 + 0.01;
        this.hue = Math.random() * 60 + 200; // Blue to cyan range
      }

      update(mouseX, mouseY) {
        // Distance from mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          this.vx -= Math.cos(angle) * force * 0.3;
          this.vy -= Math.sin(angle) * force * 0.3;
        }

        // Apply wave motion
        this.wave += this.waveSpeed;
        this.x += this.vx + Math.sin(this.wave) * 0.5;
        this.y += this.vy;

        // Friction
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Return to base position slowly
        this.vx += (this.baseX - this.x) * 0.001;
        this.vy += (this.baseY - this.y) * 0.001;

        // Update life
        this.life -= this.decay;

        // Reset if out of bounds or dead
        if (this.y > height + 10 || this.x < -10 || this.x > width + 10 || this.life <= 0) {
          this.reset();
        }
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life * 0.6;
        
        // Glow effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${this.life})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 50%, ${this.life * 0.5})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    // Initialize particles
    const particleCount = 150;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    particlesRef.current = particles;

    // Mouse tracking
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let lastTime = 0;
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(248, 250, 252, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.update(mousePos.x, mousePos.y);
        particle.draw(ctx);

        // Draw connections between nearby particles
        for (let j = index + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.save();
            ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - distance / 100) * 0.2 * particle.life * other.life})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      });

      // Draw mouse influence circle
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 200, 0, Math.PI * 2);
      ctx.stroke();
      
      const gradient = ctx.createRadialGradient(mousePos.x, mousePos.y, 0, mousePos.x, mousePos.y, 150);
      gradient.addColorStop(0, 'rgba(203, 213, 225, 0.1)');
      gradient.addColorStop(1, 'rgba(203, 213, 225, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos.x, mousePos.y]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-y-auto">
      {/* Interactive Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-10">
        <Link to={createPageUrl("Gate")}>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-700 hover:text-black hover:bg-slate-200/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-32"
        >
          <h1 className="text-8xl font-light text-slate-900 mb-6 tracking-tight">
            EARTH
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
            Where innovation meets simplicity. Experience the future of digital connection.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Globe className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Global Reach</h3>
            <p className="text-slate-600 leading-relaxed">
              Connect with millions of users worldwide through our seamless platform built for the modern age.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Zap className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Lightning Fast</h3>
            <p className="text-slate-600 leading-relaxed">
              Experience unparalleled speed and performance with our cutting-edge technology infrastructure.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Shield className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Secure by Default</h3>
            <p className="text-slate-600 leading-relaxed">
              Your privacy and security are our top priorities with enterprise-grade encryption.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Users className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Community Driven</h3>
            <p className="text-slate-600 leading-relaxed">
              Join a thriving community of innovators, creators, and visionaries shaping the future.
            </p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-slate-900 text-white hover:bg-slate-800 px-12 py-6 text-lg rounded-full font-light"
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </div>
  );
}