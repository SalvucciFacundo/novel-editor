import { Injectable, signal } from '@angular/core';
import { Editor } from '@tiptap/core';
import { Chapter } from '../../models/chapter.model';
import { Character } from '../../models/character.model';
import { Novel } from '../../models/novel.model';

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

  /** Objeto completo de la novela activa */
  readonly novel = signal<Novel | null>(null);

  /** Todos los capítulos de la novela (títulos + orden, sin contenido completo salvo el activo) */
  readonly allChapters = signal<Chapter[]>([]);

  /** Todos los personajes de la novela */
  readonly characters = signal<Character[]>([]);

  /** Capítulo actualmente cargado en el editor */
  readonly activeChapter = signal<Chapter | null>(null);

  /** true si hay cambios sin guardar */
  readonly hasUnsavedChanges = signal(false);

  /** true mientras se guarda */
  readonly saving = signal(false);

  /** Conteo de palabras en tiempo real */
  readonly wordCount = signal(0);

  /** Conteo de caracteres en tiempo real */
  readonly charCount = signal(0);

  /** Panel de búsqueda/reemplazo abierto */
  readonly searchOpen = signal(false);

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
