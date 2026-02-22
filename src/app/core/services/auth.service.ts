import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  user,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';
import { UserProfile } from '../../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  /** Señal con el usuario actual (null si no está autenticado) */
  readonly currentUser = toSignal(user(this.auth), { initialValue: null });

  /** true si hay sesión activa */
  readonly isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // Procesa el resultado del redirect de Google al volver a la app.
    // Se ejecuta en el contexto de inyección del constructor.
    this.processRedirectResult();
  }

  private async processRedirectResult(): Promise<void> {
    try {
      const credential = await getRedirectResult(this.auth);
      if (!credential) return;

      const additionalInfo = getAdditionalUserInfo(credential);
      if (additionalInfo?.isNewUser) {
        await this.createUserProfile(credential.user);
      } else {
        await this.updateLastLogin(credential.user.uid);
      }

      // Navegar a /projects después del login via redirect
      await this.router.navigate(['/projects']);
    } catch (err) {
      console.error('Error procesando redirect de Google:', err);
    }
  }

  /**
   * Inicia el flujo de login con Google via redirect (evita problemas COOP con popups).
   */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(this.auth, provider);
  }

  /** Cierra sesión y redirige al login */
  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }

  /** Crea el documento de perfil en Firestore para usuarios nuevos */
  private async createUserProfile(firebaseUser: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }): Promise<void> {
    const profile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & {
      createdAt: unknown;
      lastLoginAt: unknown;
    } = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName ?? 'Usuario',
      email: firebaseUser.email ?? '',
      photoURL: firebaseUser.photoURL ?? undefined,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(doc(this.firestore, 'users', firebaseUser.uid), profile);
  }

  /** Actualiza el timestamp de último login */
  private async updateLastLogin(uid: string): Promise<void> {
    await setDoc(
      doc(this.firestore, 'users', uid),
      { lastLoginAt: serverTimestamp() },
      { merge: true },
    );
  }
}
