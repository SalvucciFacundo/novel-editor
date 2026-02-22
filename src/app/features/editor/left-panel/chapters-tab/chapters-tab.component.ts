import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ChapterService } from '../../../../core/services/chapter.service';
import { EditorStateService } from '../../../../core/services/editor-state.service';
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

  readonly chapters = toSignal(
    this.chapterService.getChapters(this.state.novelId() ?? '').pipe(map((chapters) => chapters)),
    { initialValue: [] as Chapter[] },
  );

  readonly creating = signal(false);
  readonly renamingId = signal<string | null>(null);
  newTitle = '';
  renameTitle = '';

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

    const id = await this.chapterService.create({
      novelId,
      title: this.newTitle.trim(),
      order: this.chapters().length,
      content: '',
    });
    this.creating.set(false);
    this.newTitle = '';
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
    await this.chapterService.rename(id, this.renameTitle.trim());
    // Actualizar el capítulo activo si es el que se renombró
    const active = this.state.activeChapter();
    if (active?.id === id) {
      this.state.activeChapter.set({ ...active, title: this.renameTitle.trim() });
    }
    this.renamingId.set(null);
  }

  cancelRename(): void {
    this.renamingId.set(null);
  }

  async deleteChapter(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    if (this.state.activeChapter()?.id === id) {
      this.state.activeChapter.set(null);
    }
    await this.chapterService.delete(id);
  }
}
