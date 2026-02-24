import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Editor } from '@tiptap/core';

export interface LTMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: {
    id: string;
    description: string;
    category: { id: string; name: string };
  };
  context: { text: string; offset: number; length: number };
  sentence: string;
}

interface LTResponse {
  matches: LTMatch[];
}

export type ErrorCategory = 'spelling' | 'grammar' | 'style';

@Injectable({ providedIn: 'root' })
export class LanguageToolService {
  private http = inject(HttpClient);

  readonly loading = signal(false);
  readonly matches = signal<LTMatch[]>([]);
  readonly panelOpen = signal(false);
  readonly errorMsg = signal<string | null>(null);

  private readonly API_URL = 'https://api.languagetool.org/v2/check';

  /**
   * Envía el texto al corrector LanguageTool y abre el panel con los resultados.
   */
  check(text: string, lang: string): void {
    if (!text.trim()) return;

    this.loading.set(true);
    this.errorMsg.set(null);
    this.matches.set([]);
    this.panelOpen.set(true);

    const body = new URLSearchParams();
    body.set('text', text);
    body.set('language', lang);
    body.set('enabledOnly', 'false');

    this.http
      .post<LTResponse>(this.API_URL, body.toString(), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
      .subscribe({
        next: (res) => {
          this.matches.set(res.matches);
          this.loading.set(false);
        },
        error: () => {
          this.errorMsg.set(
            'No se pudo conectar con el corrector. Verificá tu conexión a internet.',
          );
          this.loading.set(false);
        },
      });
  }

  /** Cierra el panel y limpia el estado */
  closePanel(): void {
    this.panelOpen.set(false);
    this.matches.set([]);
    this.errorMsg.set(null);
  }

  /**
   * Aplica una sugerencia directamente en el editor Tiptap
   * y elimina ese match de la lista.
   */
  applyFix(editor: Editor, offset: number, length: number, replacement: string): void {
    const posMap = this.buildPosMap(editor);
    if (!posMap.length) return;

    const from = posMap[offset];
    const to = posMap[offset + length - 1];
    if (from === undefined || to === undefined || from === -1 || to === -1) return;

    editor
      .chain()
      .setTextSelection({ from, to: to + 1 })
      .insertContent(replacement)
      .focus()
      .run();

    // Quita el match corregido y recalcula offsets de los siguientes
    const diff = replacement.length - length;
    this.matches.update((ms) =>
      ms
        .filter((m) => !(m.offset === offset && m.length === length))
        .map((m) => (m.offset > offset ? { ...m, offset: m.offset + diff } : m)),
    );
  }

  /** Categoría de un match para aplicar estilos */
  categoryOf(match: LTMatch): ErrorCategory {
    const cat = match.rule.category.id;
    if (cat === 'TYPOS' || cat === 'MISSPELLING') return 'spelling';
    if (cat === 'GRAMMAR') return 'grammar';
    return 'style';
  }

  /**
   * Construye un mapa: índice en texto plano (getText('\n')) → posición Tiptap.
   * Los separadores de párrafo ('\n') se marcan como -1.
   */
  private buildPosMap(editor: Editor): number[] {
    const posMap: number[] = [];
    const doc = editor.state.doc;

    doc.nodesBetween(0, doc.content.size, (node, pos) => {
      if (node.isText) {
        for (let i = 0; i < (node.text ?? '').length; i++) {
          posMap.push(pos + i);
        }
        return false;
      }
      // Agregar separador '\n' entre párrafos
      if (node.type.name === 'paragraph' && posMap.length > 0) {
        posMap.push(-1);
      }
      return true;
    });

    return posMap;
  }
}
