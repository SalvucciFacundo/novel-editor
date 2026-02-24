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
      // signInWithRedirect() navega a Google — la página se va, loading queda en true
    } catch (err) {
      this.authService.loginError.set('No se pudo iniciar sesión. Intenta nuevamente.');
      console.error(err);
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
