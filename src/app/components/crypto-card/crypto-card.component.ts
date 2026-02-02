import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HighlightChangeDirective } from '../../directives/highlight-change.directive';

@Component({
  selector: 'app-crypto-card',
  standalone: true,
  templateUrl: './crypto-card.component.html',
  styleUrls: ['./crypto-card.component.css'],
  imports: [CommonModule, FormsModule, HighlightChangeDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoCardComponent {
  @Input() data!: any;
  @Input() threshold!: number;
  @Output() thresholdChange = new EventEmitter<number>();

  isOverThreshold() {
    return this.threshold > 0 && this.data.price >= this.threshold;
  }

  getChangePercent() {
    if (!this.data.previousPrice || this.data.previousPrice === 0) return 0;
    return ((this.data.price - this.data.previousPrice) / this.data.previousPrice) * 100;
  }

  // --- NUEVO: Lógica del Sparkline (Gráfico) ---
  getSparklinePoints(): string {
    const history = this.data.history || [];
    if (history.length < 2) return '';

    // Encontrar el precio más alto y más bajo para escalar la gráfica
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1; // Evitar división por cero

    // Convertir cada precio en coordenadas X,Y (SVG)
    return history.map((price: number, index: number) => {
      const x = (index / (history.length - 1)) * 100; // X: 0 a 100%
      const y = 100 - ((price - min) / range) * 100; // Y: Invertido (SVG 0 es arriba)
      return `${x},${y}`;
    }).join(' ');
  }

  getTrendColor(): string {
    if (!this.data.history || this.data.history.length < 2) return '#9ca3af'; // Gris si no hay datos
    const first = this.data.history[0];
    const last = this.data.price;
    // Si subió: Verde, si bajó: Rojo
    return last >= first ? '#10b981' : '#ef4444'; 
  }
}
