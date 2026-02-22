import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  browserPopupRedirectResolver,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase.tokens';
import { UserProfile } from '../../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(FIREBASE_AUTH);
  private firestore = inject(FIREBASE_FIRESTORE);
  private router = inject(Router);

  /** Señal con el usuario actual (null si no está autenticado) */
  readonly currentUser = signal<User | null>(null);

  /** true si hay sesión activa */
  readonly isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    onAuthStateChanged(this.auth, (user) => this.currentUser.set(user));
  }

  /**
   * Inicia sesión con Google usando el resolver explícito para evitar
   * problemas de COOP con window.close en desarrollo.
   */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    // browserPopupRedirectResolver evita el error COOP de window.close
    const credential = await signInWithPopup(this.auth, provider, browserPopupRedirectResolver);
    const additionalInfo = getAdditionalUserInfo(credential);

    if (additionalInfo?.isNewUser) {
      await this.createUserProfile(credential.user);
    } else {
      await this.updateLastLogin(credential.user.uid);
    }

    await this.router.navigate(['/projects']);
  }

  /** Cierra sesión y redirige al login */
  async logout(): Promise<void> {
    await signOut(this.auth);
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
