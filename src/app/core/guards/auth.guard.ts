import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebase.tokens';

/** Protege rutas que requieren autenticación */
export const authGuard: CanActivateFn = () => {
  const auth = inject(FIREBASE_AUTH);
  const router = inject(Router);

  return new Observable((observer) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      observer.next(user ? true : router.createUrlTree(['/login']));
      observer.complete();
    });
  });
};

/** Redirige usuarios autenticados fuera del login */
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(FIREBASE_AUTH);
  const router = inject(Router);

  return new Observable((observer) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      observer.next(user ? router.createUrlTree(['/projects']) : true);
      observer.complete();
    });
  });
};
