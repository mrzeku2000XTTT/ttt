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
  const wavesRef = useRef([]);
  const orbitParticlesRef = useRef([]);
  const trailRef = useRef([]);
  const geometryRef = useRef([]);
  const animationFrameRef = useRef(null);
  const clickRipples = useRef([]);

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
        this.hue = Math.random() * 60 + 200;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
      }

      update(mouseX, mouseY) {
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

        this.wave += this.waveSpeed;
        this.rotation += this.rotationSpeed;
        this.x += this.vx + Math.sin(this.wave) * 0.5;
        this.y += this.vy;

        this.vx *= 0.98;
        this.vy *= 0.98;

        this.vx += (this.baseX - this.x) * 0.001;
        this.vy += (this.baseY - this.y) * 0.001;

        this.life -= this.decay;

        if (this.y > height + 10 || this.x < -10 || this.x > width + 10 || this.life <= 0) {
          this.reset();
        }
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life * 0.6;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${this.life})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 70%, 50%, ${this.life * 0.5})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    // Orbit Particle class
    class OrbitParticle {
      constructor(centerX, centerY) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.radius = Math.random() * 100 + 50;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() - 0.5) * 0.02;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 60 + 200;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
      }

      update(mouseX, mouseY) {
        this.centerX += (mouseX - this.centerX) * 0.01;
        this.centerY += (mouseY - this.centerY) * 0.01;
        
        this.angle += this.speed;
        this.pulse += this.pulseSpeed;
        
        this.x = this.centerX + Math.cos(this.angle) * this.radius;
        this.y = this.centerY + Math.sin(this.angle) * this.radius;
      }

      draw(ctx) {
        const pulseSize = this.size * (1 + Math.sin(this.pulse) * 0.5);
        
        ctx.save();
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseSize * 4);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, 0.5)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, 0.8)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Ripple class
    class Ripple {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = Math.random() * 200 + 150;
        this.speed = Math.random() * 3 + 2;
        this.life = 1;
        this.decay = 0.015;
        this.hue = Math.random() * 60 + 200;
      }

      update() {
        this.radius += this.speed;
        this.life -= this.decay;
        return this.life > 0 && this.radius < this.maxRadius;
      }

      draw(ctx) {
        ctx.save();
        ctx.strokeStyle = `hsla(${this.hue}, 70%, 60%, ${this.life * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = `hsla(${this.hue}, 70%, 60%, ${this.life * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Geometry class
    class FloatingGeometry {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 40 + 20;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        this.type = Math.floor(Math.random() * 3); // 0: triangle, 1: square, 2: hexagon
        this.hue = Math.random() * 60 + 200;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
      }

      update(mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const force = (150 - distance) / 150;
          const angle = Math.atan2(dy, dx);
          this.vx -= Math.cos(angle) * force * 0.1;
          this.vy -= Math.sin(angle) * force * 0.1;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.pulse += this.pulseSpeed;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        this.vx *= 0.99;
        this.vy *= 0.99;
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const pulseSize = this.size * (1 + Math.sin(this.pulse) * 0.1);
        ctx.strokeStyle = `hsla(${this.hue}, 60%, 60%, 0.3)`;
        ctx.lineWidth = 2;
        ctx.fillStyle = `hsla(${this.hue}, 60%, 60%, 0.05)`;

        ctx.beginPath();
        if (this.type === 0) {
          // Triangle
          ctx.moveTo(0, -pulseSize / 2);
          ctx.lineTo(pulseSize / 2, pulseSize / 2);
          ctx.lineTo(-pulseSize / 2, pulseSize / 2);
        } else if (this.type === 1) {
          // Square
          ctx.rect(-pulseSize / 2, -pulseSize / 2, pulseSize, pulseSize);
        } else {
          // Hexagon
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * pulseSize / 2;
            const y = Math.sin(angle) * pulseSize / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // Trail point class
    class TrailPoint {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 60 + 200;
      }

      update() {
        this.life -= this.decay;
        return this.life > 0;
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${this.life})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 40%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
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

    // Initialize orbit particles
    const orbitCount = 20;
    const orbitParticles = [];
    for (let i = 0; i < orbitCount; i++) {
      orbitParticles.push(new OrbitParticle(width / 2, height / 2));
    }
    orbitParticlesRef.current = orbitParticles;

    // Initialize floating geometry
    const geometryCount = 8;
    const geometry = [];
    for (let i = 0; i < geometryCount; i++) {
      geometry.push(new FloatingGeometry());
    }
    geometryRef.current = geometry;

    // Mouse tracking
    let lastTrailTime = 0;
    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Add trail points
      if (currentTime - lastTrailTime > 20) {
        trailRef.current.push(new TrailPoint(e.clientX, e.clientY));
        lastTrailTime = currentTime;
      }
    };

    const handleClick = (e) => {
      clickRipples.current.push(new Ripple(e.clientX, e.clientY));
      
      // Create burst of particles
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        const speed = Math.random() * 3 + 2;
        const particle = new Particle();
        particle.x = e.clientX;
        particle.y = e.clientY;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.life = 1;
        particles.push(particle);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Animation loop
    let lastTime = 0;
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(248, 250, 252, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Draw and update floating geometry
      geometryRef.current.forEach(shape => {
        shape.update(mousePos.x, mousePos.y);
        shape.draw(ctx);
      });

      // Update and draw trail
      trailRef.current = trailRef.current.filter(point => {
        const alive = point.update();
        if (alive) point.draw(ctx);
        return alive;
      });

      // Update and draw ripples
      clickRipples.current = clickRipples.current.filter(ripple => {
        const alive = ripple.update();
        if (alive) ripple.draw(ctx);
        return alive;
      });

      // Update and draw orbit particles
      orbitParticlesRef.current.forEach(particle => {
        particle.update(mousePos.x, mousePos.y);
        
        // Draw orbit path
        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(particle.centerX, particle.centerY, particle.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        particle.draw(ctx);
      });

      // Update and draw main particles
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

        // Connect particles to orbit particles
        orbitParticlesRef.current.forEach(orbit => {
          const dx = particle.x - orbit.x;
          const dy = particle.y - orbit.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            ctx.save();
            ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - distance / 80) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(orbit.x, orbit.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      // Draw mouse influence circle with animated rings
      ctx.save();
      const time = currentTime * 0.001;
      
      for (let i = 0; i < 3; i++) {
        const offset = i * 20;
        const alpha = (1 - i * 0.3) * 0.2;
        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.lineWidth = 2 - i * 0.5;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 200 + offset + Math.sin(time + i) * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      const gradient = ctx.createRadialGradient(mousePos.x, mousePos.y, 0, mousePos.x, mousePos.y, 150);
      gradient.addColorStop(0, 'rgba(203, 213, 225, 0.15)');
      gradient.addColorStop(0.5, 'rgba(203, 213, 225, 0.05)');
      gradient.addColorStop(1, 'rgba(203, 213, 225, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      // Draw connecting lines from mouse to nearby particles
      particles.forEach(particle => {
        const dx = mousePos.x - particle.x;
        const dy = mousePos.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          ctx.save();
          ctx.strokeStyle = `rgba(100, 116, 139, ${(1 - distance / 150) * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mousePos.x, mousePos.y);
          ctx.lineTo(particle.x, particle.y);
          ctx.stroke();
          ctx.restore();
        }
      });

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
      window.removeEventListener('click', handleClick);
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

        {/* Countries Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-32"
        >
          <h2 className="text-4xl font-light text-slate-900 mb-12 text-center">
            Available in 195+ Countries
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "🇺🇸 United States", "🇬🇧 United Kingdom", "🇨🇦 Canada", "🇦🇺 Australia", "🇩🇪 Germany", "🇫🇷 France",
              "🇯🇵 Japan", "🇰🇷 South Korea", "🇨🇳 China", "🇮🇳 India", "🇧🇷 Brazil", "🇲🇽 Mexico",
              "🇪🇸 Spain", "🇮🇹 Italy", "🇳🇱 Netherlands", "🇸🇪 Sweden", "🇳🇴 Norway", "🇩🇰 Denmark",
              "🇫🇮 Finland", "🇵🇱 Poland", "🇨🇭 Switzerland", "🇦🇹 Austria", "🇧🇪 Belgium", "🇵🇹 Portugal",
              "🇮🇪 Ireland", "🇬🇷 Greece", "🇨🇿 Czech Republic", "🇷🇴 Romania", "🇭🇺 Hungary", "🇧🇬 Bulgaria",
              "🇷🇺 Russia", "🇺🇦 Ukraine", "🇹🇷 Turkey", "🇸🇦 Saudi Arabia", "🇦🇪 UAE", "🇮🇱 Israel",
              "🇪🇬 Egypt", "🇿🇦 South Africa", "🇳🇬 Nigeria", "🇰🇪 Kenya", "🇲🇦 Morocco", "🇹🇳 Tunisia",
              "🇦🇷 Argentina", "🇨🇱 Chile", "🇨🇴 Colombia", "🇵🇪 Peru", "🇻🇪 Venezuela", "🇺🇾 Uruguay",
              "🇹🇭 Thailand", "🇻🇳 Vietnam", "🇸🇬 Singapore", "🇲🇾 Malaysia", "🇮🇩 Indonesia", "🇵🇭 Philippines",
              "🇵🇰 Pakistan", "🇧🇩 Bangladesh", "🇱🇰 Sri Lanka", "🇳🇵 Nepal", "🇲🇲 Myanmar", "🇰🇭 Cambodia",
              "🇳🇿 New Zealand", "🇫🇯 Fiji", "🇵🇬 Papua New Guinea", "🇼🇸 Samoa", "🇹🇴 Tonga", "🇻🇺 Vanuatu",
              "🇨🇷 Costa Rica", "🇵🇦 Panama", "🇬🇹 Guatemala", "🇭🇳 Honduras", "🇸🇻 El Salvador", "🇳🇮 Nicaragua",
              "🇯🇲 Jamaica", "🇨🇺 Cuba", "🇩🇴 Dominican Republic", "🇭🇹 Haiti", "🇧🇸 Bahamas", "🇹🇹 Trinidad",
              "🇮🇸 Iceland", "🇱🇺 Luxembourg", "🇲🇹 Malta", "🇨🇾 Cyprus", "🇪🇪 Estonia", "🇱🇻 Latvia",
              "🇱🇹 Lithuania", "🇸🇮 Slovenia", "🇭🇷 Croatia", "🇷🇸 Serbia", "🇧🇦 Bosnia", "🇲🇰 North Macedonia",
              "🇦🇱 Albania", "🇲🇪 Montenegro", "🇽🇰 Kosovo", "🇲🇩 Moldova", "🇬🇪 Georgia", "🇦🇲 Armenia",
              "🇦🇿 Azerbaijan", "🇰🇿 Kazakhstan", "🇺🇿 Uzbekistan", "🇹🇲 Turkmenistan", "🇰🇬 Kyrgyzstan", "🇹🇯 Tajikistan",
              "🇲🇳 Mongolia", "🇰🇵 North Korea", "🇹🇼 Taiwan", "🇭🇰 Hong Kong", "🇲🇴 Macau", "🇧🇳 Brunei",
              "🇱🇦 Laos", "🇧🇹 Bhutan", "🇲🇻 Maldives", "🇦🇫 Afghanistan", "🇮🇷 Iran", "🇮🇶 Iraq",
              "🇸🇾 Syria", "🇯🇴 Jordan", "🇱🇧 Lebanon", "🇰🇼 Kuwait", "🇴🇲 Oman", "🇶🇦 Qatar",
              "🇧🇭 Bahrain", "🇾🇪 Yemen", "🇱🇾 Libya", "🇸🇩 Sudan", "🇸🇸 South Sudan", "🇪🇹 Ethiopia",
              "🇸🇴 Somalia", "🇩🇯 Djibouti", "🇪🇷 Eritrea", "🇺🇬 Uganda", "🇹🇿 Tanzania", "🇷🇼 Rwanda",
              "🇧🇮 Burundi", "🇨🇩 DR Congo", "🇨🇬 Congo", "🇨🇲 Cameroon", "🇨🇫 CAR", "🇹🇩 Chad",
              "🇳🇪 Niger", "🇲🇱 Mali", "🇧🇫 Burkina Faso", "🇸🇳 Senegal", "🇬🇳 Guinea", "🇸🇱 Sierra Leone",
              "🇱🇷 Liberia", "🇨🇮 Ivory Coast", "🇬🇭 Ghana", "🇹🇬 Togo", "🇧🇯 Benin", "🇬🇦 Gabon",
              "🇬🇶 Equatorial Guinea", "🇦🇴 Angola", "🇿🇲 Zambia", "🇿🇼 Zimbabwe", "🇲🇼 Malawi", "🇲🇿 Mozambique",
              "🇧🇼 Botswana", "🇳🇦 Namibia", "🇱🇸 Lesotho", "🇸🇿 Eswatini", "🇲🇬 Madagascar", "🇲🇺 Mauritius",
              "🇸🇨 Seychelles", "🇰🇲 Comoros", "🇨🇻 Cape Verde", "🇸🇹 Sao Tome", "🇬🇼 Guinea-Bissau", "🇬🇲 Gambia",
              "🇲🇷 Mauritania", "🇩🇿 Algeria", "🇧🇴 Bolivia", "🇪🇨 Ecuador", "🇵🇾 Paraguay", "🇬🇾 Guyana",
              "🇸🇷 Suriname", "🇬🇫 French Guiana", "🇧🇿 Belize", "🇱🇨 Saint Lucia", "🇻🇨 St Vincent", "🇬🇩 Grenada",
              "🇧🇧 Barbados", "🇦🇬 Antigua", "🇩🇲 Dominica", "🇰🇳 St Kitts", "🇦🇼 Aruba", "🇨🇼 Curaçao"
            ].map((country, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.01 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/40 backdrop-blur-sm p-3 rounded-lg border border-slate-200/50 hover:border-slate-300 hover:bg-white/60 transition-all cursor-pointer text-center"
              >
                <span className="text-sm text-slate-700 font-light">{country}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8 font-light">
            And many more regions worldwide...
          </p>
        </motion.div>

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