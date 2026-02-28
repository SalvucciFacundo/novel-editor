import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import {
  GoogleAuthProvider,
  User,
  getAdditionalUserInfo,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase.tokens';
import { UserProfile } from '../../models/user-profile.model';

/** Usuario ficticio para el modo invitado */
const GUEST_USER = {
  uid: 'guest',
  displayName: 'Invitado',
  email: '',
  photoURL: null,
} as unknown as User;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(FIREBASE_AUTH);
  private firestore = inject(FIREBASE_FIRESTORE);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly loginError = signal<string | null>(null);
  /** true cuando Firebase resolvió el estado de auth inicial */
  readonly authReady = signal(false);

  /** Indica si la sesión actual es de modo invitado (sin Firebase) */
  readonly isGuest = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Escuchar cambios de auth y marcar como listo tras el primer callback
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser.set(user);
        this.authReady.set(true);
      });

      // Procesar resultado del redirect (fallback para popups bloqueados)
      getRedirectResult(this.auth)
        .then(async (credential) => {
          if (!credential) return;
          const additionalInfo = getAdditionalUserInfo(credential);
          if (additionalInfo?.isNewUser) {
            await this.createUserProfile(credential.user);
          } else {
            await this.updateLastLogin(credential.user.uid);
          }
          await this.router.navigate(['/projects']);
        })
        .catch((err) => {
          console.error('Redirect login error:', err);
          this.loginError.set('No se pudo iniciar sesión. Intenta nuevamente.');
        });
    } else {
      // En el servidor (SSR) no hay auth — marcar como listo inmediatamente
      this.authReady.set(true);
    }
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Popup es más rápido y confiable; evita problemas de cookies third-party
      const credential = await signInWithPopup(this.auth, provider);
      const info = getAdditionalUserInfo(credential);
      if (info?.isNewUser) {
        await this.createUserProfile(credential.user);
      } else {
        await this.updateLastLogin(credential.user.uid);
      }
      await this.router.navigate(['/projects']);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-blocked') {
        // Fallback: redirect para navegadores que bloquean popups
        await signInWithRedirect(this.auth, provider);
      } else {
        throw err;
      }
    }
  }

  /** Inicia sesión en modo invitado (sin Firebase, datos en memoria) */
  async loginAsGuest(): Promise<void> {
    this.isGuest.set(true);
    this.currentUser.set(GUEST_USER);
    await this.router.navigate(['/projects']);
  }

  /** Cierra sesión y redirige al login */
  async logout(): Promise<void> {
    if (!this.isGuest()) {
      await signOut(this.auth);
    }
    this.isGuest.set(false);
    this.currentUser.set(null);
    await this.router.navigate(['/login']);
  }

  /** Crea el documento de perfil en Firestore para usuarios nuevos */
  private async createUserProfile(firebaseUser: User): Promise<void> {
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
