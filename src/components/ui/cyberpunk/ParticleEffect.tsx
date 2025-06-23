'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

interface ParticleEffectProps {
  className?: string;
  particleCount?: number;
  colors?: string[];
  maxSize?: number;
  minSize?: number;
  speed?: number;
  fadeSpeed?: number;
}

export function ParticleEffect({
  className,
  particleCount = 50,
  colors = ['#9333EA', '#10B981'],
  maxSize = 4,
  minSize = 1,
  speed = 1,
  fadeSpeed = 0.02
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: Math.random() * (maxSize - minSize) + minSize,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };
    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Fade out
        particle.life -= fadeSpeed;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Respawn dead particles
        if (particle.life <= 0) {
          particlesRef.current[index] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            size: Math.random() * (maxSize - minSize) + minSize,
            life: 1,
            color: colors[Math.floor(Math.random() * colors.length)]
          };
        }

        // Draw particle
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, colors, maxSize, minSize, speed, fadeSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 pointer-events-none', className)}
    />
  );
}

// Click particle burst effect
export function useParticleBurst() {
  const createBurst = (e: React.MouseEvent, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create temporary particle container
    const particleContainer = document.createElement('div');
    particleContainer.style.position = 'absolute';
    particleContainer.style.left = '0';
    particleContainer.style.top = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.overflow = 'hidden';
    container.appendChild(particleContainer);

    // Create particles
    const particleCount = 15;
    const colors = ['#9333EA', '#10B981', '#fff'];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '4px';
      particle.style.height = '4px';
      particle.style.borderRadius = '50%';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.boxShadow = `0 0 6px ${particle.style.backgroundColor}`;
      particle.style.pointerEvents = 'none';
      
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      particleContainer.appendChild(particle);
      
      // Animate particle
      let start: number;
      const duration = 1000;
      
      const animateParticle = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;
        
        if (progress < 1) {
          const currentX = x + vx * progress;
          const currentY = y + vy * progress + (gravity * progress * progress) / 2;
          
          particle.style.left = `${currentX}px`;
          particle.style.top = `${currentY}px`;
          particle.style.opacity = `${1 - progress}`;
          particle.style.transform = `scale(${1 - progress * 0.5})`;
          
          requestAnimationFrame(animateParticle);
        } else {
          particle.remove();
          if (particleContainer.children.length === 0) {
            particleContainer.remove();
          }
        }
      };
      
      const gravity = 200;
      requestAnimationFrame(animateParticle);
    }
  };

  return createBurst;
}