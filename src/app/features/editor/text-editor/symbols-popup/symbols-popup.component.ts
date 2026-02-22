import { ChangeDetectionStrategy, Component, output } from '@angular/core';

const SYMBOLS: { category: string; items: string[] }[] = [
  { category: 'Comillas', items: ['«', '»', '"', '"', "'", "'", '‹', '›'] },
  { category: 'Corchetes', items: ['【', '】', '〔', '〕', '《', '》', '〈', '〉'] },
  { category: 'Corazones', items: ['♥', '♡', '❤', '💕', '💗', '💖', '💘', '💞'] },
  { category: 'Estrellas', items: ['★', '☆', '✦', '✧', '✨', '⭐', '🌟', '💫'] },
  { category: 'Puntuación', items: ['…', '—', '–', '·', '•', '※', '†', '‡'] },
  { category: 'Japonés', items: ['〜', '～', '！', '？', '。', '、', '「', '」'] },
  { category: 'Varios', items: ['♪', '♫', '✿', '❀', '☾', '☽', '∞', '✉'] },
];

@Component({
  selector: 'app-symbols-popup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="symbols-popup" role="dialog" aria-label="Símbolos especiales">
      @for (group of groups; track group.category) {
        <div class="symbols-popup__group">
          <span class="symbols-popup__label">{{ group.category }}</span>
          <div class="symbols-popup__items">
            @for (sym of group.items; track sym) {
              <button
                class="symbols-popup__btn"
                (click)="symbolSelected.emit(sym)"
                [title]="sym"
                [attr.aria-label]="sym"
              >
                {{ sym }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './symbols-popup.component.scss',
})
export class SymbolsPopupComponent {
  readonly symbolSelected = output<string>();
  readonly close = output<void>();
  readonly groups = SYMBOLS;
}
