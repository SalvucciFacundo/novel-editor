import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorStateService } from '../../../core/services/editor-state.service';
import { LanguageToolService } from '../../../core/services/language-tool.service';
import { SpellcheckService } from '../../../core/services/spellcheck.service';
import { SearchReplaceComponent } from './search-replace/search-replace.component';
import { SpellCheckPanelComponent } from './spell-check-panel/spell-check-panel.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { WordCountBarComponent } from './word-count-bar/word-count-bar.component';

@Component({
  selector: 'app-text-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ToolbarComponent,
    SpellCheckPanelComponent,
    SearchReplaceComponent,
    WordCountBarComponent,
  ],
  template: `
    <div class="text-editor">
      <app-toolbar />
      @if (state.searchOpen()) {
        <app-search-replace />
      }
      <div class="text-editor__main">
        <div class="text-editor__scroll">
          <div class="text-editor__page">
            <div #editorEl class="text-editor__content"></div>
          </div>
        </div>
        @defer (when lt.panelOpen()) {
          <app-spell-check-panel />
        }
      </div>
      <app-word-count-bar />
    </div>
  `,
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;

  readonly state = inject(EditorStateService);
  private spellcheck = inject(SpellcheckService);
  readonly lt = inject(LanguageToolService);

  @HostListener('document:keydown.control.f', ['$event'])
  onCtrlF(event: Event): void {
    if (!this.state.editor) return;
    event.preventDefault();
    this.state.searchOpen.set(true);
  }

  constructor() {
    effect(() => {
      const lang = this.spellcheck.language();
      const dom = this.state.editor?.view?.dom as HTMLElement | undefined;
      if (dom) {
        dom.setAttribute('lang', lang);
      }
    });
  }

  private applyLang(): void {
    const dom = this.state.editor?.view?.dom as HTMLElement | undefined;
    if (dom) {
      dom.setAttribute('lang', this.spellcheck.language());
    }
  }

  ngAfterViewInit(): void {
    const editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        TextStyle,
        FontFamily,
        Placeholder.configure({ placeholder: 'Empezá a escribir tu historia...' }),
      ],
      content: this.state.activeChapter()?.content ?? '',
      onUpdate: ({ editor }) => {
        this.state.markDirty();
        this.updateCounts(editor);
      },
      editorProps: {
        attributes: {
          class: 'prose-editor',
          spellcheck: 'true',
          lang: this.spellcheck.language(),
        },
      },
    });

    this.state.editor = editor;
    this.applyLang();
    this.updateCounts(editor);
  }

  ngOnDestroy(): void {
    // El editor se destruye en EditorComponent.ngOnDestroy
  }

  private updateCounts(editor: Editor): void {
    const text = editor.getText({ blockSeparator: ' ' });
    const trimmed = text.trim();
    this.state.wordCount.set(trimmed ? trimmed.split(/\s+/).length : 0);
    this.state.charCount.set(text.replace(/\s/g, '').length);
  }
}
