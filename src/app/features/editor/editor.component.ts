import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, filter, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { NovelService } from '../../core/services/novel.service';
import { ChapterService } from '../../core/services/chapter.service';
import { EditorStateService } from '../../core/services/editor-state.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { LeftPanelComponent } from './left-panel/left-panel.component';
import { TextEditorComponent } from './text-editor/text-editor.component';
import { AiChatComponent } from './ai-chat/ai-chat.component';

@Component({
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LeftPanelComponent, TextEditorComponent, AiChatComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements OnInit, OnDestroy {
  readonly novelId = input.required<string>();

  private novelService = inject(NovelService);
  private chapterService = inject(ChapterService);
  readonly editorState = inject(EditorStateService);
  private auth = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private toast = inject(ToastService);

  private destroy$ = new Subject<void>();

  readonly novelTitle = signal('');
  readonly exportOpen = signal(false);
  readonly saving = this.editorState.saving;
  readonly hasUnsaved = this.editorState.hasUnsavedChanges;
  readonly activeChapter = this.editorState.activeChapter;

  /** Estado de los drawers en mobile */
  readonly leftOpen = signal(false);
  readonly rightOpen = signal(false);

  constructor() {
    // Autoguardado: 5 segundos después del último cambio
    toObservable(this.editorState.hasUnsavedChanges)
      .pipe(
        filter((v) => v),
        debounceTime(5000),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.save());
  }

  closeLeft(): void {
    this.leftOpen.set(false);
  }
  closeRight(): void {
    this.rightOpen.set(false);
  }
  closeAll(): void {
    this.leftOpen.set(false);
    this.rightOpen.set(false);
  }

  ngOnInit(): void {
    this.editorState.novelId.set(this.novelId());
    this.loadNovelTitle();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.editorState.novelId.set(null);
    this.editorState.activeChapter.set(null);
    this.editorState.editor?.destroy();
    this.editorState.editor = null;
  }

  private async loadNovelTitle(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    const novels = await this.novelService.getNovels(uid);
    const novel = novels.find((n) => n.id === this.novelId());
    if (novel) this.novelTitle.set(novel.title);
  }

  async save(): Promise<void> {
    const chapter = this.activeChapter();
    if (!chapter || !this.editorState.editor) return;
    this.editorState.saving.set(true);
    try {
      await this.chapterService.save(chapter.id, this.editorState.editor.getHTML());
      this.editorState.markSaved();
    } catch {
      this.toast.error('No se pudo guardar. Verificá tu conexión.');
    } finally {
      this.editorState.saving.set(false);
    }
  }

  exportTxt(): void {
    const chapter = this.activeChapter();
    if (!chapter || !this.editorState.editor) return;
    this.exportOpen.set(false);
    this.downloadFile(`${chapter.title}.txt`, this.editorState.editor.getText(), 'text/plain');
  }

  exportPdf(): void {
    const chapter = this.activeChapter();
    if (!chapter || !this.editorState.editor) return;
    this.exportOpen.set(false);
    const html = this.editorState.editor.getHTML();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>${chapter.title}</title>
      <style>
        body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.8;
               max-width: 700px; margin: 40px auto; color: #111; padding: 0 20px; }
        h1,h2,h3 { font-weight: 700; margin: 1.5em 0 0.5em; }
        p { margin: 0 0 1em; } blockquote { border-left: 3px solid #999;
            padding: 0.5em 1em; color: #555; font-style: italic; }
        @media print { body { margin: 0; } }
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  }

  private downloadFile(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
