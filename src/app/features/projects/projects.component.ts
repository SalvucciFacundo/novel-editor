import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="projects-page">
      <header class="projects-header">
        <h1>✦ Mis Novelas</h1>
        <button (click)="logout()">Cerrar sesión</button>
      </header>
      <p>Componente de proyectos — próximamente</p>
    </main>
  `,
  styles: [
    `
      .projects-page {
        padding: 2rem;
        color: white;
        background: #0f0f0f;
        min-height: 100vh;
      }
      .projects-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      button {
        padding: 0.5rem 1rem;
        background: #333;
        color: white;
        border: 1px solid #555;
        border-radius: 8px;
        cursor: pointer;
      }
    `,
  ],
})
export class ProjectsComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  async logout() {
    await this.auth.logout();
  }
}
