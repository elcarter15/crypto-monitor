import { Component, inject, OnInit, DestroyRef, PLATFORM_ID, Inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CoreService, PriceData } from '../../services/core.service';
import { CryptoCardComponent } from '../crypto-card/crypto-card.component';
import { ParticleBgDirective } from '../../directives/particle-bg.directive';

interface ExtendedPriceData extends PriceData {
  previousPrice: number;
  history: number[];
  movingAverage: number;
  volatility: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CryptoCardComponent, ParticleBgDirective],
  templateUrl: './dashboard.component.html',
  styles: [`
    .page-container { 
      max-width: 900px; 
      margin: 0 auto; 
      text-align: center; 
      font-family: sans-serif; 
      padding: 20px;
      position: relative;
      z-index: 10;
      background: transparent !important; 
      min-height:100vh;
    }
    
    .particle-canvas {
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100vw; 
      height: 100vh; 
      z-index: 0; 
      pointer-events: none;
    }

    .header-row, .crypto-grid, .footer-text {
      position: relative;
      z-index: 20;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px; 
      margin-bottom: 40px;
    }

    .title-icon {
      width: 50px;
      height: 50px;
      filter: drop-shadow(0 4px 6px rgba(247, 147, 26, 0.3)); 
    }

    .main-title { 
      font-size: 2rem; 
      font-weight: bold; 
      color: #333; 
      margin: 0;
    }
    
    .theme-toggle {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      color: #666;
      transition: color 0.3s;
      z-index: 30;
    }
    .theme-toggle:hover { color: #333; }

    .crypto-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
      gap: 20px; 
      padding: 10px;
    }
    
    .footer-text { 
      color: #888; 
      font-size: 0.9rem; 
      margin-top: 40px; 
    }

    .dark-mode .main-title { color: #f3f4f6; }
    .dark-mode .footer-text { color: #9ca3af; }
    .dark-mode .theme-toggle { color: #9ca3af; }
    .dark-mode .theme-toggle:hover { color: #f3f4f6; }
  `]
})
export class DashboardComponent implements OnInit {
  private coreService = inject(CoreService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  
  private worker: any;
  public isDarkMode = signal(false);
  
  private rawAssets = signal<ExtendedPriceData[]>([]);
  public thresholds = signal<Record<string, number>>({});
  
  // --- SEGUIMIENTO DE ALERTAS (Para sonar una sola vez) ---
  private activeAlerts = new Set<string>();

  public assetsList = computed(() => this.rawAssets());

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('crypto-thresholds', JSON.stringify(this.thresholds()));
      }
    });

    // EFECTO PARA MONITOREAR ALERTAS Y REPRODUCIR SONIDO
    effect(() => {
      const assets = this.assetsList();
      this.checkAlerts(assets);
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.isDarkMode.set(true);
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }

      const savedThresholds = localStorage.getItem('crypto-thresholds');
      if (savedThresholds) {
        try {
          this.thresholds.set(JSON.parse(savedThresholds));
        } catch (e) {
          console.error("Error cargando umbrales", e);
        }
      }
    }

    if (isPlatformBrowser(this.platformId)) {
      this.worker = new Worker(new URL('../../crypto-worker.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event: MessageEvent) => {
        this.updateAssetWithWorkerData(event.data);
      };
    }

    this.coreService.getPriceFeed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(prices => {
      const updatedAssets = prices.map(price => {
        const current = this.rawAssets().find((a: ExtendedPriceData) => a.id === price.id);
        const history = current ? [...current.history, price.price].slice(-10) : [price.price]; 
        
        if (history.length >= 2 && this.worker) {
          this.worker.postMessage({ id: price.id, history });
        }

        return {
          ...price,
          previousPrice: current ? current.price : price.price,
          history: history,
          movingAverage: current ? current.movingAverage : price.price, 
          volatility: current ? current.volatility : 0
        };
      });
      
      this.rawAssets.set(updatedAssets);
    });
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
    if (this.isDarkMode()) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  private updateAssetWithWorkerData(result: { id: string, movingAverage: number, volatility: number }) {
    this.rawAssets.update((assets: ExtendedPriceData[]) => 
      assets.map((a: ExtendedPriceData) => a.id === result.id ? { ...a, movingAverage: result.movingAverage, volatility: result.volatility } : a)
    );
  }

  updateThreshold(id: string, value: number) {
    this.thresholds.update((prev: Record<string, number>) => ({
      ...prev,
      [id]: value
    }));
  }

  // --- LÓGICA DE ALARMAS SONORAS ---
  checkAlerts(assets: ExtendedPriceData[]) {
    assets.forEach(asset => {
      const threshold = this.thresholds()[asset.id];
      const isAlerting = threshold > 0 && asset.price >= threshold;

      if (isAlerting) {
        // Si no estaba alertando antes -> Reproducir sonido
        if (!this.activeAlerts.has(asset.id)) {
          this.playAlertSound();
          this.activeAlerts.add(asset.id);
        }
      } else {
        // Si ya no está alertando -> Eliminar del set (para que pueda sonar de nuevo si sube de nuevo)
        if (this.activeAlerts.has(asset.id)) {
          this.activeAlerts.delete(asset.id);
        }
      }
    });
  }

  playAlertSound() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'square'; // Sonido digital "Beep"
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // Frecuencia Alta (A5)
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Baja tono en 0.1s

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); // Desvanecer

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1); // Dura 0.1s
    } catch (e) {
      console.warn("Audio no soportado o bloqueado", e);
    }
  }
}
