import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
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

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly loginError = signal<string | null>(null);

  constructor() {
    onAuthStateChanged(this.auth, (user) => this.currentUser.set(user));

    // Procesar el resultado del redirect de Google al volver a la app
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
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    // Redirect evita el error COOP de Firebase Hosting con signInWithPopup
    await signInWithRedirect(this.auth, provider);
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
