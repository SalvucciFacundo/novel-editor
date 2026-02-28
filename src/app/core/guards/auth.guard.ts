import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Protege rutas que requieren autenticación */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isGuest()) return true;

  return toObservable(authService.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => (authService.currentUser() ? true : router.createUrlTree(['/login']))),
  );
};

/** Redirige usuarios autenticados fuera del login */
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isGuest()) return router.createUrlTree(['/projects']);

  return toObservable(authService.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => (authService.currentUser() ? router.createUrlTree(['/projects']) : true)),
  );
};
