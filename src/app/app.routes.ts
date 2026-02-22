import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: 'editor/:novelId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/editor/editor.component').then((m) => m.EditorComponent),
  },
  {
    path: '**',
    redirectTo: 'projects',
  },
];
