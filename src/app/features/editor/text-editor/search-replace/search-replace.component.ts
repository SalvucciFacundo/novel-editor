import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import { EditorStateService } from '../../../../core/services/editor-state.service';

interface Match {
  from: number;
  to: number;
}

@Component({
  selector: 'app-search-replace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './search-replace.component.html',
  styleUrl: './search-replace.component.scss',
})
export class SearchReplaceComponent {
  private state = inject(EditorStateService);

  searchTerm = '';
  replaceTerm = '';
  readonly caseSensitive = signal(false);
  readonly currentIdx = signal(0);
  readonly totalMatches = signal(0);

  readonly statusText = computed(() => {
    const total = this.totalMatches();
    if (!this.searchTerm) return '';
    if (total === 0) return 'Sin resultados';
    return `${this.currentIdx() + 1} / ${total}`;
  });

  private matches: Match[] = [];

  /** Cierra con Escape */
  @HostListener('keydown.escape')
  close(): void {
    this.state.searchOpen.set(false);
    this.state.editor?.commands.focus();
  }

  search(): void {
    const editor = this.state.editor;
    if (!editor || !this.searchTerm.trim()) {
      this.matches = [];
      this.totalMatches.set(0);
      return;
    }
    this.matches = this.findMatches(editor);
    this.totalMatches.set(this.matches.length);
    this.currentIdx.set(0);
    if (this.matches.length > 0) this.highlightMatch(editor, 0);
  }

  next(): void {
    if (!this.matches.length) {
      this.search();
      return;
    }
    const idx = (this.currentIdx() + 1) % this.matches.length;
    this.currentIdx.set(idx);
    this.highlightMatch(this.state.editor!, idx);
  }

  prev(): void {
    if (!this.matches.length) {
      this.search();
      return;
    }
    const idx = (this.currentIdx() - 1 + this.matches.length) % this.matches.length;
    this.currentIdx.set(idx);
    this.highlightMatch(this.state.editor!, idx);
  }

  replace(): void {
    const editor = this.state.editor;
    if (!editor || !this.matches.length) return;
    const match = this.matches[this.currentIdx()];
    editor.chain().setTextSelection(match).insertContent(this.replaceTerm).focus().run();
    this.search();
  }

  replaceAll(): void {
    const editor = this.state.editor;
    if (!editor || !this.matches.length) return;

    // Reemplazar de atrás hacia adelante para no perder posiciones
    const reversed = [...this.matches].reverse();
    let tr = editor.state.tr;
    for (const m of reversed) {
      tr = tr.replaceWith(
        m.from,
        m.to,
        this.replaceTerm ? editor.schema.text(this.replaceTerm) : ([] as any),
      );
    }
    editor.view.dispatch(tr);
    editor.commands.focus();
    this.search();
  }

  /** Toggle distincion mayúsculas */
  toggleCase(): void {
    this.caseSensitive.update((v) => !v);
    this.search();
  }

  private findMatches(editor: Editor): Match[] {
    const matches: Match[] = [];
    const term = this.searchTerm;
    if (!term) return matches;

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = this.caseSensitive() ? 'g' : 'gi';
    const regex = new RegExp(escaped, flags);
    const doc = editor.state.doc;

    doc.nodesBetween(0, doc.content.size, (node, pos) => {
      if (!node.isText || !node.text) return;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(node.text)) !== null) {
        matches.push({ from: pos + m.index, to: pos + m.index + m[0].length });
      }
    });

    return matches;
  }

  private highlightMatch(editor: Editor, idx: number): void {
    const match = this.matches[idx];
    if (!match) return;
    editor.chain().setTextSelection({ from: match.from, to: match.to }).focus().run();

    // Scroll para que el match sea visible
    const view = editor.view;
    const coords = view.coordsAtPos(match.from);
    const editorEl = view.dom.closest('.text-editor__scroll');
    if (editorEl) {
      const rect = editorEl.getBoundingClientRect();
      const relativeTop = coords.top - rect.top + editorEl.scrollTop;
      editorEl.scrollTo({ top: relativeTop - 200, behavior: 'smooth' });
    }
  }
}
