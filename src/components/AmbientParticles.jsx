import React, { useEffect, useRef } from 'react';

/**
 * AmbientParticles: Living Background Particle & Constellation Engine
 * 
 * - Generates 70-100 delicate luminous dust motes & celestial grains
 * - Continuous organic floating motion with subtle harmonic drift
 * - Micro-connections between neighboring particles for depth
 * - Gentle repulsion from cursor for tactile interactivity
 * - Adaptive color palette matching the active theme accent
 * - Strictly optimized (capped particle pool, requestAnimationFrame, zero-lag)
 */
export const AmbientParticles = ({ currentTheme = 'olive-moss' }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, active: false };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Particle pool
    const particleCount = Math.min(85, Math.floor((width * height) / 16000));
    let particles = [];

    const getThemeColors = () => {
      const style = getComputedStyle(document.documentElement);
      const accent = style.getPropertyValue('--accent').trim() || '#d4de95';
      const rgb = style.getPropertyValue('--accent-rgb').trim() || '212, 222, 149';
      return { accent, rgb };
    };

    // Curated 24K Golden Embers & Stardust Palette
    const GOLD_PALETTE = [
      { hex: '#ffd700', rgb: '255, 215, 0' },    // Pure 24K Gold
      { hex: '#fbbf24', rgb: '251, 191, 36' },   // Radiant Amber Gold
      { hex: '#fde047', rgb: '253, 224, 71' },   // Solar Gold Spark
      { hex: '#ffffff', rgb: '255, 255, 255' },  // Diamond Shimmer
      { hex: '#f59e0b', rgb: '245, 158, 11' },   // Deep Warm Amber
    ];

    const initParticles = () => {
      particles = [];
      const { accent, rgb } = getThemeColors();

      for (let i = 0; i < particleCount; i++) {
        const gold = GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: -0.2 - Math.random() * 0.55, // Gentle upward buoyant floating
          radius: 0.9 + Math.random() * 2.2,
          alpha: 0.2 + Math.random() * 0.55,
          baseAlpha: 0.2 + Math.random() * 0.55,
          pulseSpeed: 0.015 + Math.random() * 0.025,
          pulseOffset: Math.random() * Math.PI * 2,
          colorHex: gold.hex,
          colorRgb: gold.rgb
        });
      }
    };

    initParticles();

    let lastTime = performance.now();

    const render = (time) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const { accent, rgb } = getThemeColors();

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);

        // Gentle harmonic pulse in brightness
        p.pulseOffset += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulseOffset) * 0.18;
        if (p.alpha < 0.05) p.alpha = 0.05;

        // Wrap edges smoothly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Mouse gentle repulsion
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 1.2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Draw golden particle with luminous halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(${p.colorRgb}, ${p.alpha})`;
        ctx.shadowColor = p.colorHex;
        ctx.shadowBlur = p.radius * 3.5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw faint golden celestial connections between nearby particles
      ctx.lineWidth = 0.75;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const connAlpha = (1 - dist / 90) * 0.18 * Math.min(p1.alpha, p2.alpha);
            ctx.strokeStyle = `rgba(251, 191, 36, ${connAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [currentTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="ambient-particles-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85,
        mixBlendMode: 'screen'
      }}
    />
  );
};
