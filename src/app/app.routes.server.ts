import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'projects',
    renderMode: RenderMode.Client,
  },
  {
    path: 'editor/:novelId',
    renderMode: RenderMode.Client, // Ruta dinámica con auth → solo cliente
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
