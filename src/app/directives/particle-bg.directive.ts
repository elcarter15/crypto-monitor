import { Directive, ElementRef, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appParticleBg]',
  standalone: true
})
export class ParticleBgDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID); // Inyectamos el ID de la plataforma
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId!: number;
  private particles: any[] = [];

  ngAfterViewInit() {
    // IMPORTANTE: Solo inicializamos si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.initCanvas();
      this.createParticles();
      this.animate();
    }
  }

  ngOnDestroy() {
    // También protegemos la destrucción
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private initCanvas() {
    this.canvas = this.el.nativeElement;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d')!;
    
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.createParticles(); 
    });
  }

  private createParticles() {
    this.particles = [];
    const numberOfParticles = (this.canvas.width * this.canvas.height) / 15000;

    for (let i = 0; i < numberOfParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 2 
      });
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Verificamos document solo si estamos en el navegador (aunque el if de arriba ya lo cubre)
    const isDark = document.body.classList.contains('dark-mode');
    
    const color = isDark ? '255, 255, 255' : '59, 130, 246';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color}, 0.8)`;
      this.ctx.fill();

      for (let j = i; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(${color}, ${1 - distance / 100})`;
          this.ctx.lineWidth = 1.5;
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}
