import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoBannerComponent } from './shared/components/demo-banner/demo-banner.component';
import { ToastComponent } from './shared/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DemoBannerComponent, ToastComponent],
  template: `
    @if (!authService.authReady()) {
      <div class="auth-loading" aria-label="Cargando aplicación" role="status">
        <div class="auth-loading__spinner" aria-hidden="true"></div>
        <p class="auth-loading__text">Iniciando&hellip;</p>
      </div>
    } @else {
      <router-outlet />
      <app-demo-banner />
    }
    <app-toast />
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .auth-loading {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #0f0f1a;
        gap: 1rem;
        z-index: 9999;
      }
      .auth-loading__spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid rgba(59, 130, 246, 0.2);
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      .auth-loading__text {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.35);
        letter-spacing: 0.07em;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly authService = inject(AuthService);
}
