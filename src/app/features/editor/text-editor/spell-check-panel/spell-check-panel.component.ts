import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EditorStateService } from '../../../../core/services/editor-state.service';
import { LanguageToolService, LTMatch } from '../../../../core/services/language-tool.service';

@Component({
  selector: 'app-spell-check-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spell-check-panel.component.html',
  styleUrl: './spell-check-panel.component.scss',
})
export class SpellCheckPanelComponent {
  readonly lt = inject(LanguageToolService);
  private editorState = inject(EditorStateService);

  /** Aplica la sugerencia seleccionada en el editor */
  apply(match: LTMatch, replacement: string): void {
    const editor = this.editorState.editor;
    if (!editor) return;
    this.lt.applyFix(editor, match.offset, match.length, replacement);
  }

  /** Ignorar un match (quitarlo de la lista sin aplicar cambios) */
  ignore(match: LTMatch): void {
    this.lt.matches.update((ms) =>
      ms.filter((m) => !(m.offset === match.offset && m.length === match.length)),
    );
  }

  /** Clase CSS según categoría del error */
  categoryClass(match: LTMatch): string {
    return `error--${this.lt.categoryOf(match)}`;
  }

  /** Etiqueta amigable de la categoría */
  categoryLabel(match: LTMatch): string {
    const labels: Record<string, string> = {
      spelling: 'Ortografía',
      grammar: 'Gramática',
      style: 'Estilo',
    };
    return labels[this.lt.categoryOf(match)] ?? 'Sugerencia';
  }
}
