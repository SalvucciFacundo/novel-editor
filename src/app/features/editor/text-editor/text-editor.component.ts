import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
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
import { SpellcheckService } from '../../../core/services/spellcheck.service';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
  selector: 'app-text-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToolbarComponent],
  template: `
    <div class="text-editor">
      <app-toolbar />
      <div class="text-editor__scroll">
        <div class="text-editor__page">
          <div #editorEl class="text-editor__content"></div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;

  private state = inject(EditorStateService);
  private spellcheck = inject(SpellcheckService);

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
      onUpdate: () => {
        this.state.markDirty();
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
  }

  ngOnDestroy(): void {
    // El editor se destruye en EditorComponent.ngOnDestroy
  }
}
