import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChapterService } from '../../../../core/services/chapter.service';
import { EditorStateService } from '../../../../core/services/editor-state.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Chapter } from '../../../../models/chapter.model';

@Component({
  selector: 'app-chapters-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './chapters-tab.component.html',
  styleUrl: './chapters-tab.component.scss',
})
export class ChaptersTabComponent {
  private chapterService = inject(ChapterService);
  readonly state = inject(EditorStateService);
  private toast = inject(ToastService);

  readonly chapters = signal<Chapter[]>([]);
  readonly creating = signal(false);
  readonly renamingId = signal<string | null>(null);
  newTitle = '';
  renameTitle = '';

  constructor() {
    effect(() => {
      const novelId = this.state.novelId();
      if (novelId) this.load(novelId);
      else this.chapters.set([]);
    });
  }

  private async load(novelId: string): Promise<void> {
    try {
      const data = await this.chapterService.getChapters(novelId);
      this.chapters.set(data);
    } catch {
      this.toast.error('Error al cargar los capítulos.');
    }
  }

  loadChapter(chapter: Chapter): void {
    if (this.state.activeChapter()?.id === chapter.id) return;
    this.state.activeChapter.set(chapter);
    this.state.markSaved();
    // Cargar contenido en el editor
    setTimeout(() => {
      this.state.editor?.commands.setContent(chapter.content || '');
    }, 50);
  }

  startCreate(): void {
    this.newTitle = `Capítulo ${(this.chapters().length ?? 0) + 1}`;
    this.creating.set(true);
  }

  async confirmCreate(): Promise<void> {
    if (!this.newTitle.trim()) return;
    const novelId = this.state.novelId();
    if (!novelId) return;
    try {
      await this.chapterService.create({
        novelId,
        title: this.newTitle.trim(),
        order: this.chapters().length,
        content: '',
      });
      this.toast.success('Capítulo creado');
    } catch {
      this.toast.error('No se pudo crear el capítulo.');
    }
    this.creating.set(false);
    this.newTitle = '';
    await this.load(novelId);
  }

  cancelCreate(): void {
    this.creating.set(false);
    this.newTitle = '';
  }

  startRename(chapter: Chapter): void {
    this.renamingId.set(chapter.id);
    this.renameTitle = chapter.title;
  }

  async confirmRename(id: string): Promise<void> {
    if (!this.renameTitle.trim()) return;
    try {
      await this.chapterService.rename(id, this.renameTitle.trim());
      const active = this.state.activeChapter();
      if (active?.id === id) {
        this.state.activeChapter.set({ ...active, title: this.renameTitle.trim() });
      }
      this.toast.success('Capítulo renombrado');
    } catch {
      this.toast.error('No se pudo renombrar el capítulo.');
    }
    this.renamingId.set(null);
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }

  cancelRename(): void {
    this.renamingId.set(null);
  }

  async deleteChapter(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    try {
      if (this.state.activeChapter()?.id === id) {
        this.state.activeChapter.set(null);
      }
      await this.chapterService.delete(id);
      this.toast.success('Capítulo eliminado');
    } catch {
      this.toast.error('No se pudo eliminar el capítulo.');
    }
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }

  async moveUp(event: Event, chapter: Chapter): Promise<void> {
    event.stopPropagation();
    const list = [...this.chapters()];
    const idx = list.findIndex((c) => c.id === chapter.id);
    if (idx <= 0) return;
    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
    list.forEach((c, i) => (c.order = i));
    this.chapters.set(list);
    await this.chapterService.reorder(list.map((c) => ({ id: c.id, order: c.order })));
  }

  async moveDown(event: Event, chapter: Chapter): Promise<void> {
    event.stopPropagation();
    const list = [...this.chapters()];
    const idx = list.findIndex((c) => c.id === chapter.id);
    if (idx >= list.length - 1) return;
    [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    list.forEach((c, i) => (c.order = i));
    this.chapters.set(list);
    await this.chapterService.reorder(list.map((c) => ({ id: c.id, order: c.order })));
  }
}
