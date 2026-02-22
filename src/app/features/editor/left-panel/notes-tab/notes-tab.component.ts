import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { NoteService } from '../../../../core/services/note.service';
import { EditorStateService } from '../../../../core/services/editor-state.service';
import { Note } from '../../../../models/note.model';

@Component({
  selector: 'app-notes-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SlicePipe],
  templateUrl: './notes-tab.component.html',
  styleUrl: './notes-tab.component.scss',
})
export class NotesTabComponent {
  private noteService = inject(NoteService);
  readonly state = inject(EditorStateService);

  readonly notes = signal<Note[]>([]);
  readonly modalNote = signal<Note | null>(null);
  readonly editing = signal(false);
  readonly creating = signal(false);

  // Campos del formulario de creación
  newTitle = '';
  newContent = '';

  // Campos del formulario de edición (en modal)
  editTitle = '';
  editContent = '';

  constructor() {
    effect(() => {
      const novelId = this.state.novelId();
      if (novelId) this.load(novelId);
      else this.notes.set([]);
    });
  }

  private async load(novelId: string): Promise<void> {
    try {
      const data = await this.noteService.getNotes(novelId);
      this.notes.set(data);
    } catch (err) {
      console.error('Error cargando notas:', err);
    }
  }

  openNote(note: Note): void {
    this.modalNote.set(note);
    this.editing.set(false);
    this.editTitle = note.title;
    this.editContent = note.content;
  }

  closeModal(): void {
    this.modalNote.set(null);
    this.editing.set(false);
  }

  startEdit(): void {
    this.editing.set(true);
  }

  async saveEdit(): Promise<void> {
    const note = this.modalNote();
    if (!note || !this.editTitle.trim()) return;
    await this.noteService.update(note.id, {
      title: this.editTitle.trim(),
      content: this.editContent,
    });
    this.modalNote.set({ ...note, title: this.editTitle, content: this.editContent });
    this.editing.set(false);
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }
  }

  async deleteNote(id: string): Promise<void> {
    await this.noteService.delete(id);
    this.closeModal();
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }

  startCreate(): void {
    this.newTitle = '';
    this.newContent = '';
    this.creating.set(true);
  }

  async confirmCreate(): Promise<void> {
    if (!this.newTitle.trim()) return;
    const novelId = this.state.novelId();
    if (!novelId) return;
    await this.noteService.create({
      novelId,
      title: this.newTitle.trim(),
      content: this.newContent,
    });
    this.creating.set(false);
    await this.load(novelId);
  }

  cancelCreate(): void {
    this.creating.set(false);
  }
}
