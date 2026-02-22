import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { NovelService } from '../../core/services/novel.service';
import { Novel } from '../../models/novel.model';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent implements OnInit {
  private authService = inject(AuthService);
  private novelService = inject(NovelService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  readonly novels = toSignal(this.novelService.getNovels(), { initialValue: [] });
  readonly loading = signal(true);
  readonly showModal = signal(false);
  readonly modalLoading = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly novelToDelete = signal<Novel | null>(null);

  /** Placeholders para el skeleton loader */
  readonly skeletons = Array(4);

  // Campos del formulario de nueva novela
  newTitle = '';
  newDescription = '';

  ngOnInit(): void {
    // Dar un pequeño margen para que Firestore responda antes de ocultar el skeleton
    setTimeout(() => this.loading.set(false), 800);
  }

  openNovel(id: string): void {
    this.router.navigate(['/editor', id]);
  }

  openModal(): void {
    this.newTitle = '';
    this.newDescription = '';
    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async createNovel(): Promise<void> {
    if (!this.newTitle.trim()) return;

    this.modalLoading.set(true);
    this.modalError.set(null);

    try {
      const uid = this.authService.currentUser()?.uid;
      if (!uid) throw new Error('No hay usuario autenticado');

      const id = await this.novelService.create({
        title: this.newTitle.trim(),
        description: this.newDescription.trim(),
        ownerId: uid,
        tags: [],
      });

      this.closeModal();
      this.router.navigate(['/editor', id]);
    } catch {
      this.modalError.set('No se pudo crear la novela. Intenta de nuevo.');
    } finally {
      this.modalLoading.set(false);
    }
  }

  confirmDelete(event: Event, novel: Novel): void {
    event.stopPropagation();
    this.novelToDelete.set(novel);
  }

  cancelDelete(): void {
    this.novelToDelete.set(null);
  }

  async deleteNovel(): Promise<void> {
    const novel = this.novelToDelete();
    if (!novel) return;

    this.modalLoading.set(true);
    try {
      await this.novelService.delete(novel.id);
      this.cancelDelete();
    } catch {
      // En caso de error simplemente cerramos
      this.cancelDelete();
    } finally {
      this.modalLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}

