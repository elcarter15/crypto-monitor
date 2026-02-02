import { Directive, Input, ElementRef, Renderer2, OnChanges } from '@angular/core';

@Directive({
  selector: '[appHighlightChange]',
  standalone: true
})
export class HighlightChangeDirective implements OnChanges {
  @Input('appHighlightChange') price!: number;
  @Input() previousPrice!: number;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {
    if (this.previousPrice !== undefined && this.price !== this.previousPrice) {
      const flashClass = this.price > this.previousPrice ? 'flash-green' : 'flash-red';
      
      // Limpiar clases previas
      this.renderer.removeClass(this.el.nativeElement, 'flash-green');
      this.renderer.removeClass(this.el.nativeElement, 'flash-red');

      // Forzar reflow para reiniciar animación si se ejecuta muy rápido
      void this.el.nativeElement.offsetWidth; 

      this.renderer.addClass(this.el.nativeElement, flashClass);

      // Eliminar clase después de la animación (500ms definido en CSS)
      setTimeout(() => {
        this.renderer.removeClass(this.el.nativeElement, flashClass);
      }, 500);
    }
  }
}
