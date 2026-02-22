import { Injectable, signal } from '@angular/core';
import { Editor } from '@tiptap/core';
import { Chapter } from '../../models/chapter.model';

/**
 * Servicio singleton que comparte el estado del editor entre todos los subcomponentes.
 * Actúa como fuente de verdad para el capítulo activo y la instancia de Tiptap.
 */
@Injectable({ providedIn: 'root' })
export class EditorStateService {
  /** Instancia de Tiptap (se setea desde TextEditorComponent) */
  editor: Editor | null = null;

  /** ID de la novela activa */
  readonly novelId = signal<string | null>(null);

  /** Capítulo actualmente cargado en el editor */
  readonly activeChapter = signal<Chapter | null>(null);

  /** true si hay cambios sin guardar */
  readonly hasUnsavedChanges = signal(false);

  /** true mientras se guarda */
  readonly saving = signal(false);

  /**
   * Inserta texto en la posición actual del cursor en Tiptap.
   * Usado por el tab de personajes para insertar nombres.
   */
  insertTextAtCursor(text: string): void {
    this.editor?.chain().focus().insertContent(text).run();
  }

  /** Marca cambios como guardados */
  markSaved(): void {
    this.hasUnsavedChanges.set(false);
  }

  /** Marca que hay cambios pendientes */
  markDirty(): void {
    this.hasUnsavedChanges.set(true);
  }
}
