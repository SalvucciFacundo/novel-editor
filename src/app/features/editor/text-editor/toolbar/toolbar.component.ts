import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EditorStateService } from '../../../../core/services/editor-state.service';
import { SymbolsPopupComponent } from '../symbols-popup/symbols-popup.component';

interface FontOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SymbolsPopupComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  readonly state = inject(EditorStateService);
  readonly showSymbols = signal(false);

  readonly fonts: FontOption[] = [
    { label: 'Serif', value: 'Noto Serif' },
    { label: 'Sans', value: 'Inter' },
    { label: 'Mono', value: 'JetBrains Mono' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Times New', value: 'Times New Roman' },
  ];

  get editor() {
    return this.state.editor;
  }

  isBold() {
    return this.editor?.isActive('bold') ?? false;
  }
  isItalic() {
    return this.editor?.isActive('italic') ?? false;
  }
  isUnderline() {
    return this.editor?.isActive('underline') ?? false;
  }
  isH1() {
    return this.editor?.isActive('heading', { level: 1 }) ?? false;
  }
  isH2() {
    return this.editor?.isActive('heading', { level: 2 }) ?? false;
  }
  isBlockquote() {
    return this.editor?.isActive('blockquote') ?? false;
  }

  toggleBold() {
    this.editor?.chain().focus().toggleBold().run();
  }
  toggleItalic() {
    this.editor?.chain().focus().toggleItalic().run();
  }
  toggleUnderline() {
    this.editor?.chain().focus().toggleUnderline().run();
  }
  toggleH1() {
    this.editor?.chain().focus().toggleHeading({ level: 1 }).run();
  }
  toggleH2() {
    this.editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }
  toggleBlockquote() {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  setFont(value: string): void {
    this.editor?.chain().focus().setFontFamily(value).run();
  }

  insertSymbol(symbol: string): void {
    this.state.insertTextAtCursor(symbol);
    this.showSymbols.set(false);
  }

  toggleSymbols(): void {
    this.showSymbols.update((v) => !v);
  }
}
