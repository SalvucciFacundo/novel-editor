import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  /** Señal con el usuario actual (null si no está autenticado) */
  readonly currentUser = toSignal(user(this.auth), { initialValue: null });

  /** true si hay sesión activa */
  readonly isLoggedIn = computed(() => !!this.currentUser());

  /** Inicia sesión con Google popup */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
    await this.router.navigate(['/projects']);
  }

  /** Cierra sesión y redirige al login */
  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }
}
