import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async onGoogleLogin(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithGoogle();
    } catch (err) {
      this.error.set('No se pudo iniciar sesión. Intenta nuevamente.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
