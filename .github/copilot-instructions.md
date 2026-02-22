# Novel Editor – Copilot Instructions

## Proyecto
Editor de novelas construido con **Angular 20+** y **Firebase**. Aplicación SSR (Server-Side Rendering) con Angular Universal.

---

## Angular 20+ – Reglas generales

### Componentes
- Usar **standalone components** en todos los componentes (`standalone: true`).
- Usar **signals** para el estado local: `signal()`, `computed()`, `effect()`.
- Usar **inputs como señales**: `input()` en lugar de `@Input()`.
- Usar **outputs como señales**: `output()` en lugar de `@Output()`.
- Usar `ChangeDetectionStrategy.OnPush` por defecto.
- Usar **host bindings** en la clase en lugar del objeto `host`.
- Preferir `inject()` en lugar de constructor injection.

```typescript
// ✅ Correcto
@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class ExampleComponent {
  private service = inject(ExampleService);
  title = input<string>('');
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}
```

### Control de flujo
- Usar `@if`, `@for`, `@switch` (control flow nativo) en lugar de `*ngIf`, `*ngFor`, `*ngSwitch`.
- En `@for` siempre incluir `track`.

```html
<!-- ✅ Correcto -->
@for (item of items(); track item.id) {
  <app-item [data]="item" />
}
@if (isLoading()) {
  <app-spinner />
}
```

### Servicios
- Decorar con `@Injectable({ providedIn: 'root' })`.
- Usar `inject()` para dependencias.
- Exponer estado como **señales readonly** con `toSignal()` o `signal()`.

### HTTP
- Usar `httpResource()` para carga de datos con señales.
- Usar `inject(HttpClient)` en lugar de constructor injection.

### Routing
- Usar **lazy loading** con `loadComponent`.
- Usar **functional guards** (`CanActivateFn`).
- Leer parámetros de ruta con `inject(ActivatedRoute)` + `toSignal()`.

### Formularios
- Preferir **Reactive Forms** con `FormBuilder`.
- Para formularios simples usar `ngModel` con señales.

---

## Firebase – Reglas de integración

### Configuración
- Inicializar Firebase con `initializeApp()` en `app.config.ts`.
- Usar `provideFirebaseApp()`, `provideFirestore()`, `provideAuth()`, `provideStorage()`.
- Nunca hardcodear API keys; usar variables de entorno en `environment.ts`.

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
  ]
};
```

### Firestore
- Usar `inject(Firestore)` en servicios.
- Preferir `collectionData()` y `docData()` del paquete `@angular/fire/firestore` para obtener observables reactivos.
- Convertir Observables a señales con `toSignal()`.
- Usar tipado estricto en todos los modelos de datos.
- Estructurar colecciones con nombres en `camelCase` plural (e.g., `novels`, `chapters`).
- Nunca hacer queries sin límite/paginación en colecciones grandes.

```typescript
// ✅ Correcto
@Injectable({ providedIn: 'root' })
export class NovelService {
  private firestore = inject(Firestore);

  getNovels(): Observable<Novel[]> {
    const novelsRef = collection(this.firestore, 'novels');
    return collectionData(novelsRef, { idField: 'id' }) as Observable<Novel[]>;
  }
}
```

### Auth
- Usar `inject(Auth)` para acceder a la instancia de Auth.
- Usar `authState()` de `@angular/fire/auth` para reactividad.
- Implementar guards con `CanActivateFn` basados en el estado de autenticación.
- Manejar errores de autenticación con mensajes amigables al usuario.
- No exponer tokens o información sensible en logs.

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return authState(auth).pipe(
    take(1),
    map(user => user ? true : router.createUrlTree(['/login']))
  );
};
```

### Storage
- Usar `inject(Storage)` para acceder a Firebase Storage.
- Siempre validar tipo y tamaño de archivo antes de subir.
- Estructurar rutas de storage: `users/{uid}/novels/{novelId}/cover`.
- Proveer feedback de progreso en uploads.

---

## Diseño – Reglas de UI/UX

### Estilos
- Usar **SCSS** para todos los estilos.
- Usar **CSS Custom Properties** para el sistema de diseño (colores, tipografía, espaciado).
- Mobile-first: diseñar para móvil primero y escalar hacia arriba.
- Usar `rem` para tamaños de fuente y espaciado consistente.

### Accesibilidad
- Todo elemento interactivo debe tener atributos ARIA apropiados.
- Asegurar contraste de color mínimo **4.5:1** para texto.
- Soporte completo de navegación por teclado.
- Usar elementos HTML semánticos (`<main>`, `<nav>`, `<article>`, etc.).

### Componentes de UI
- Construir componentes pequeños y reutilizables.
- Evitar estilos inline; siempre usar clases SCSS.
- Implementar estados: `loading`, `empty`, `error`, `success`.
- Preferir animaciones CSS (`@keyframes`) sobre JavaScript para animaciones simples.

### Performance
- Usar `@defer` para carga diferida de componentes pesados.
- Optimizar imágenes con `NgOptimizedImage`.
- Lazy load de rutas con `loadComponent`.

---

## Estructura de archivos

```
src/
  app/
    core/           # Servicios singleton, guards, interceptors
    features/       # Módulos de funcionalidades (lazy loaded)
      novels/
      editor/
      auth/
    shared/         # Componentes, pipes y directivas reutilizables
    models/         # Interfaces y tipos TypeScript
  environments/     # Variables de entorno
```

---

## TypeScript – Reglas generales
- Usar `strict: true` en `tsconfig.json`.
- Preferir `interface` sobre `type` para objetos.
- Nunca usar `any`; si es necesario, usar `unknown`.
- Usar nombres descriptivos para variables y funciones.
- Documentar funciones complejas con JSDoc.

---

## Convenciones de código
- Nombres de archivos en `kebab-case`.
- Nombres de clases en `PascalCase`.
- Nombres de variables y funciones en `camelCase`.
- Constantes en `UPPER_SNAKE_CASE`.
- Respetar la guía de estilo oficial de Angular.
