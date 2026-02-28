import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly guestLoading = signal(false);
  readonly particles = Array.from({ length: 10 });
  readonly pwa = inject(PwaInstallService);

  async onGoogleLogin(): Promise<void> {
    this.loading.set(true);
    this.authService.loginError.set(null);
    try {
      await this.authService.loginWithGoogle();
      // Con popup: la navegación ocurre dentro del servicio — el componente se destruye
      // Con redirect fallback: la página navega a Google, loading queda en true
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg =
        code === 'auth/popup-closed-by-user'
          ? 'Cerrá la ventana antes de completar el inicio de sesión.'
          : code === 'auth/cancelled-popup-request'
            ? 'Ya hay una ventana de inicio de sesión abierta.'
            : 'No se pudo iniciar sesión. Intentá nuevamente.';
      this.authService.loginError.set(msg);
      this.loading.set(false);
    }
  }

  async onGuestLogin(): Promise<void> {
    this.guestLoading.set(true);
    try {
      await this.authService.loginAsGuest();
    } finally {
      this.guestLoading.set(false);
    }
  }
}
