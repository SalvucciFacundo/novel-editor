import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EditorStateService } from '../../../../core/services/editor-state.service';

@Component({
  selector: 'app-word-count-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state.activeChapter()) {
      <div class="word-count-bar">
        <span>{{ state.wordCount() }} palabras</span>
        <span class="word-count-bar__sep">·</span>
        <span>{{ state.charCount() }} caracteres</span>
        <span class="word-count-bar__sep">·</span>
        <span>~{{ readingTime() }} min de lectura</span>
      </div>
    }
  `,
  styleUrl: './word-count-bar.component.scss',
})
export class WordCountBarComponent {
  readonly state = inject(EditorStateService);
  readonly readingTime = computed(() => Math.max(1, Math.ceil(this.state.wordCount() / 200)));
}
