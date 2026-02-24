import { ChangeDetectionStrategy, Component, effect, inject, DOCUMENT } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/** Altura del banner en px — debe coincidir con el padding del SCSS */
const BANNER_HEIGHT = '44px';

@Component({
  selector: 'app-demo-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.isGuest()) {
      <div class="demo-banner" role="status" aria-live="polite">
        <span class="demo-banner__text">
          <strong>Modo demo</strong> — los cambios no se guardan.
        </span>
        <button class="demo-banner__cta" (click)="auth.loginWithGoogle()" type="button">
          Crear cuenta gratuita
        </button>
      </div>
    }
  `,
  styleUrl: './demo-banner.component.scss',
})
export class DemoBannerComponent {
  readonly auth = inject(AuthService);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    // Expone la altura del banner como CSS var para que los scrollables
    // puedan agregar padding-bottom y evitar que el contenido quede tapado.
    effect(() => {
      this.doc.documentElement.style.setProperty(
        '--demo-banner-h',
        this.auth.isGuest() ? BANNER_HEIGHT : '0px',
      );
    });
  }
}
